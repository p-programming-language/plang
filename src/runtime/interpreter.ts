import path from "path";

import type { IndexValueType, ObjectType, TypeLiteralValueType, ValueType } from "../code-analysis/type-checker";
import type { Constructable } from "./values/constructable";
import type { Type } from "../code-analysis/type-checker/types/type";
import { IntrinsicRegistrationError, RuntimeError } from "../errors";
import { INTRINSIC_EXTENDED_LITERAL_VALUE_TYPES } from "../code-analysis/type-checker/types/type-sets";
import { Token } from "../code-analysis/tokenization/token";
import { Callable } from "./values/callable";
import { Range } from "./values/range";
import { fakeToken, fileExists, isDirectory } from "../utility";
import type Binder from "../code-analysis/binder";
import type Resolver from "../code-analysis/resolver";
import type P from "../../tools/p";
import type BoundIsExpression from "../code-analysis/binder/bound-expressions/is";
import type BoundTypeOfExpression from "../code-analysis/binder/bound-expressions/typeof";
import SingularType from "../code-analysis/type-checker/types/singular-type";
import LiteralType from "../code-analysis/type-checker/types/literal-type";
import UnionType from "../code-analysis/type-checker/types/union-type";
import ArrayType from "../code-analysis/type-checker/types/array-type";
import Syntax from "../code-analysis/tokenization/syntax-type";
import Scope from "./scope";
import HookedException from "./hooked-exceptions";
import Intrinsics from "./intrinsics";
import PFunction from "./values/function";
import PClass from "./values/class";
import Intrinsic from "./values/intrinsic";
import IntrinsicExtension from "./intrinsics/value-extensions";
import AST from "../code-analysis/parser/ast";

import { LiteralExpression } from "../code-analysis/parser/ast/expressions/literal";
import type { StringInterpolationExpression } from "../code-analysis/parser/ast/expressions/string-interpolation";
import type { RangeLiteralExpression } from "../code-analysis/parser/ast/expressions/range-literal";
import type { ArrayLiteralExpression } from "../code-analysis/parser/ast/expressions/array-literal";
import type { ObjectLiteralExpression } from "../code-analysis/parser/ast/expressions/object-literal";
import type { ParenthesizedExpression } from "../code-analysis/parser/ast/expressions/parenthesized";
import type { UnaryExpression } from "../code-analysis/parser/ast/expressions/unary";
import { BinaryExpression } from "../code-analysis/parser/ast/expressions/binary";
import type { TernaryExpression } from "../code-analysis/parser/ast/expressions/ternary";
import { IdentifierExpression } from "../code-analysis/parser/ast/expressions/identifier";
import { CompoundAssignmentExpression } from "../code-analysis/parser/ast/expressions/compound-assignment";
import { VariableAssignmentExpression } from "../code-analysis/parser/ast/expressions/variable-assignment";
import { PropertyAssignmentExpression } from "../code-analysis/parser/ast/expressions/property-assignment";
import type { CallExpression } from "../code-analysis/parser/ast/expressions/call";
import type { AccessExpression } from "../code-analysis/parser/ast/expressions/access";
import type { IsExpression } from "../code-analysis/parser/ast/expressions/is";
import type { IsInExpression } from "../code-analysis/parser/ast/expressions/is-in";
import type { TypeOfExpression } from "../code-analysis/parser/ast/expressions/typeof";
import type { NewExpression } from "../code-analysis/parser/ast/expressions/new";
import type { ExpressionStatement } from "../code-analysis/parser/ast/statements/expression";
import type { VariableAssignmentStatement } from "../code-analysis/parser/ast/statements/variable-assignment";
import type { VariableDeclarationStatement } from "../code-analysis/parser/ast/statements/variable-declaration";
import { BlockStatement } from "../code-analysis/parser/ast/statements/block";
import type { IfStatement } from "../code-analysis/parser/ast/statements/if";
import type { WhileStatement } from "../code-analysis/parser/ast/statements/while";
import type { FunctionDeclarationStatement } from "../code-analysis/parser/ast/statements/function-declaration";
import type { ReturnStatement } from "../code-analysis/parser/ast/statements/return";
import type { UseStatement } from "../code-analysis/parser/ast/statements/use";
import type { BreakStatement } from "../code-analysis/parser/ast/statements/break";
import type { EveryStatement } from "../code-analysis/parser/ast/statements/every";
import type { NextStatement } from "../code-analysis/parser/ast/statements/next";
import type { ClassBodyStatement } from "../code-analysis/parser/ast/statements/class-body";
import type { ClassDeclarationStatement } from "../code-analysis/parser/ast/statements/class-declaration";
import type { MethodDeclarationStatement } from "../code-analysis/parser/ast/statements/method-declaration";
import type { PropertyDeclarationStatement } from "../code-analysis/parser/ast/statements/property-declaration";

export default class Interpreter implements AST.Visitor.Expression<ValueType>, AST.Visitor.Statement<void> {
  public readonly globals = new Scope;
  public scope = this.globals;
  public maxRecursionDepth = 1200;
  public definedArgv = false;

  private recursionDepth = 1;
  private loopLevel = 0;
  private readonly intrinsics = new Intrinsics(this);

  public constructor(
    public readonly runner: P,
    public readonly resolver: Resolver,
    public readonly binder: Binder,
    public fileName = "unnamed"
  ) {
    this.intrinsics.inject();
  }

  public visitPackageStatement(): void {
    // do nothing
  }

  public visitMethodDeclarationStatement(stmt: MethodDeclarationStatement): PFunction {
    return new PFunction(stmt, this.scope, this.runner.host.typeTracker);
  }

  public visitPropertyDeclarationStatement(stmt: PropertyDeclarationStatement): ValueType {
    return stmt.initializer ? this.evaluate(stmt.initializer) : undefined;
  }

  public visitClassBodyStatement(stmt: ClassBodyStatement): void {
    // do nothing, logic handled in PClass
  }

  public visitClassDeclarationStatement(stmt: ClassDeclarationStatement): void {
    this.scope.define(stmt.name, new PClass(stmt, this.scope, this.runner.host.typeTracker), {
      mutable: false
    });
  }

  public visitNewExpression(expr: NewExpression): ValueType {
    const _class = <Constructable>this.evaluate(expr.classRef);
    const fitsArity = typeof _class.constructorArity === "number" ? expr.constructorArgs.length === _class.constructorArity : _class.constructorArity.doesFit(expr.constructorArgs.length);
    if (!fitsArity)
      throw new RuntimeError(`Expected call to '${_class.name}()' to have ${_class.constructorArity.toString()} arguments, got ${expr.constructorArgs.length}`, expr.token);

    const constructorArgs = expr.constructorArgs.map(arg => this.evaluate(arg));
    return _class.construct(this, constructorArgs);
  }

  public visitEveryStatement(stmt: EveryStatement): void {
    const enclosing = this.scope;
    this.scope = new Scope(this.scope);

    let iterable = this.evaluate(stmt.iterable);
    for (const declaration of stmt.elementDeclarations)
      this.scope.define(declaration.identifier.name, undefined, {
        mutable: true
      });

    if (typeof iterable === "number")
      iterable = new Range(1, iterable);

    if (iterable instanceof Range) {
      iterable = iterable.minimum <= iterable.maximum ?
        Array.from({ length: iterable.maximum - iterable.minimum + 1 }, (_, i) => (<Range>iterable).minimum + i)
        : Array.from({ length: iterable.minimum - iterable.maximum + 1 }, (_, i) => (<Range>iterable).minimum - i);
    }

    if (typeof iterable === "string")
      iterable = iterable.split("");

    let level = 0;
    this.loopLevel++;
    if (iterable instanceof Array) {
      for (const value of iterable) {
        const index = iterable.indexOf(value);
        const [valueDecl, indexDecl] = stmt.elementDeclarations;
        this.startRecursion(stmt.token);
        level++;

        this.scope.assign(valueDecl.identifier.name, value);
        if (indexDecl)
          this.scope.assign(indexDecl.identifier.name, index);

        try {
          let block = stmt.body;
          if (!(block instanceof BlockStatement))
            block = new BlockStatement(block.token, [block]);

          this.executeBlock(<BlockStatement>block, this.scope);
        } catch(e: any) {
          if (e instanceof HookedException.Break)
            if (this.loopLevel === e.loopLevel)
              break;
          else if (e instanceof HookedException.Next)
            if (this.loopLevel === e.loopLevel)
              continue;
          else
            throw e;
        }
      }
    } else if (iterable instanceof Callable) {
      let value;
      while (value = iterable.call() !== undefined) {
        const [valueDecl] = stmt.elementDeclarations;
        this.startRecursion(stmt.token);
        level++;

        this.scope.assign(valueDecl.identifier.name, value);
        try {
          let block = stmt.body;
          if (!(block instanceof BlockStatement))
            block = new BlockStatement(block.token, [block]);

          this.executeBlock(<BlockStatement>block, this.scope);
        } catch(e: any) {
          if (e instanceof HookedException.Break)
            if (this.loopLevel === e.loopLevel)
              break;
          else if (e instanceof HookedException.Next)
            if (this.loopLevel === e.loopLevel)
              continue;
          else
            throw e;
        }
      }
    } else if (iterable instanceof Object) {
      for (const [key, value] of Object.entries(iterable)) {
        const [keyDecl, valueDecl] = stmt.elementDeclarations;
        this.startRecursion(stmt.token);
        level++;

        this.scope.assign(keyDecl.identifier.name, key);
        if (valueDecl)
          this.scope.assign(valueDecl.identifier.name, value);

        try {
          let block = stmt.body;
          if (!(block instanceof BlockStatement))
            block = new BlockStatement(block.token, [block]);

          this.executeBlock(<BlockStatement>block, this.scope);
        } catch(e: any) {
          if (e instanceof HookedException.Break)
            if (this.loopLevel === e.loopLevel)
              break;
          else if (e instanceof HookedException.Next)
            if (this.loopLevel === e.loopLevel)
              continue;
          else
            throw e;
        }
      }
    }

    this.loopLevel--;
    this.endRecursion(level);
    this.scope = enclosing;
  }

  public visitNextStatement(stmt: NextStatement): void {
    throw new HookedException.Next(stmt.token, this.loopLevel);
  }

  public visitBreakStatement(stmt: BreakStatement): void {
    throw new HookedException.Break(stmt.token, this.loopLevel);
  }

  public visitUseStatement(stmt: UseStatement): void {
    if (stmt.location.intrinsic) {
      const lib = this.resolveIntrinsicLib(stmt.keyword, stmt.location.path);
      if (stmt.members === true)
        lib.inject();
      else
        for (const member of stmt.members) {
          const libMember = lib.members[member.lexeme];
          if (!libMember)
            throw new RuntimeError(`Import '${member.lexeme}' does not exist for '${stmt.location.path.replace(/\//g, ".")}'`, member);

          if (lib.propertyTypes[member.lexeme])
            this.intrinsics.define(member.lexeme, libMember, lib.propertyTypes[member.lexeme]);
          else if (libMember instanceof Function && "intrinsicKind" in <object>libMember && (<any>libMember).intrinsicKind === Intrinsic.Kind.Function)
            this.intrinsics.defineFunction(member.lexeme, <Intrinsic.FunctionCtor>libMember);
          else if (libMember instanceof Intrinsic.Function)
            this.intrinsics.defineFunctionFromInstance(member.lexeme, libMember);
          else if (libMember instanceof Function && "intrinsicKind" in <object>libMember && (<any>libMember).intrinsicKind === Intrinsic.Kind.Lib)
            this.intrinsics.defineLib(member.lexeme, <Intrinsic.LibCtor>libMember);
          else if (libMember instanceof Intrinsic.Lib)
            this.intrinsics.defineLibFromInstance(member.lexeme, libMember);
          else if (libMember instanceof Function && "intrinsicKind" in <object>libMember && (<any>libMember).intrinsicKind === Intrinsic.Kind.Class)
            this.intrinsics.defineClass(member.lexeme, <Intrinsic.ClassCtor>libMember);
          else if (libMember instanceof Intrinsic.Class)
            this.intrinsics.defineClassFromInstance(member.lexeme, libMember);
          else if (!lib.propertyTypes[member.lexeme])
            throw new IntrinsicRegistrationError(`Failed to register intrinsic lib '${lib.name}': '${member.lexeme}' is not an intrinsic function, library, or class, yet it has no value in 'propertyTypes'`, member);
        }
    } else {
      throw new RuntimeError("Module imports are not supported yet", stmt.keyword);
    }
  }

  private resolveIntrinsicLib(token: Token<undefined>, filePath: string): Intrinsic.Lib {
    const libsFolder = path.join(__dirname, "intrinsics", "libs");
    const libPath = path.join(libsFolder, filePath.slice(1));
    if (!fileExists(libPath) && !fileExists(libPath + ".js"))
      throw new RuntimeError(`Invalid import: Intrinsic import path '${filePath}' does not exist`, token);

    let libFile = libPath;
    if (isDirectory(libPath))
      libFile = path.join(libPath, "index.js");
    else
      libFile += ".js";

    const Lib = <Intrinsic.LibCtor>require(libFile).default;
    const parentName = libFile.split(path.sep).at(-2);
    return new Lib(this.intrinsics, parentName === "libs" || libFile.endsWith("index.js") ? undefined : parentName);
  }

  public visitTypeDeclarationStatement(): void {
    // do nothing
  }

  public visitReturnStatement(stmt: ReturnStatement): void {
    const value = this.evaluate(stmt.expression);
    throw new HookedException.Return(stmt.token, value);
  }

  public visitFunctionDeclarationStatement(stmt: FunctionDeclarationStatement): void {
    const fn = new PFunction(stmt, this.scope, this.runner.host.typeTracker);
    this.scope.define(stmt.name, fn, {
      mutable: false
    });
  }

  public visitWhileStatement(stmt: WhileStatement): void {
    this.loopLevel++;
    const inverted = stmt.token.syntax === Syntax.Until;
    let level = 0;

    while (inverted ? !this.evaluate(stmt.condition) : this.evaluate(stmt.condition)) {
      this.startRecursion(stmt.token);
      try {
        this.execute(stmt.body);
      } catch(e: any) {
        if (e instanceof HookedException.Break)
          if (this.loopLevel === e.loopLevel)
            break;
        else if (e instanceof HookedException.Next)
          if (this.loopLevel === e.loopLevel)
            continue;
        else
          throw e;
      }
      level++;
    }

    this.endRecursion(level);
    this.loopLevel--;
  }

  public visitIfStatement(stmt: IfStatement): void {
    const condition = this.evaluate(stmt.condition);
    const inverted = stmt.token.syntax === Syntax.Unless;

    if (inverted ? !condition : condition)
      this.execute(stmt.body)
    else if (stmt.elseBranch)
      this.execute(stmt.elseBranch);
  }

  public visitBlockStatement(stmt: BlockStatement): void {
    this.evaluate(stmt.members);
  }

  public visitVariableDeclarationStatement(stmt: VariableDeclarationStatement): void {
    const value = stmt.initializer ? this.evaluate(stmt.initializer) : undefined;
    this.scope.define(stmt.identifier.name, value, {
      mutable: stmt.mutable
    });
  }

  public visitVariableAssignmentStatement(stmt: VariableAssignmentStatement): void {
    const value = this.evaluate(stmt.value);
    this.scope.assign(stmt.identifier.name, value);
  }

  public visitExpressionStatement(stmt: ExpressionStatement): ValueType {
    return this.evaluate(stmt.expression);
  }

  public visitIsInExpression(expr: IsInExpression): boolean {
    const value = this.evaluate(expr.value);
    const object = this.evaluate(expr.object);
    const inValues = Object.values(<any>object).includes(value);
    if (typeof object === "string")
      return inValues;

    return <any>value in <any>object || inValues;
  }

  public visitIsExpression(expr: IsExpression): boolean {
    const boundIsExpr = this.binder.getBoundNode<BoundIsExpression>(expr);
    const matches = boundIsExpr.value.type.isAssignableTo(boundIsExpr.typeToCheck);
    return expr.inversed ? !matches : matches;
  }

  public visitTypeOfExpression(expr: TypeOfExpression): string {
    const boundTypeOfExpr = this.binder.getBoundNode<BoundTypeOfExpression>(expr);
    return this.getTypeName(boundTypeOfExpr.value.type);
  }

  private getTypeName(type: Type): string {
    if (type instanceof LiteralType)
      return SingularType.fromLiteral(type).name;
    else if (type instanceof UnionType)
      return [...new Set(type.types.map(t => this.getTypeName(t)))].join(" | ");
    else
      return (<SingularType>type).name;
  }

  public visitIndexExpression(expr: AccessExpression): ValueType {
    const object = this.evaluate(expr.object);
    const index = this.evaluate(expr.index);
    if (object instanceof Intrinsic.Lib)
      return object.members[<any>index];


    const realValue = (<ValueType[] | ObjectType>object)[<any>index];
    if (
      INTRINSIC_EXTENDED_LITERAL_VALUE_TYPES.includes(typeof object)
      || object instanceof Array
      || object instanceof Range
    ) {

      const extendedType = SingularType.fromValue(object);
      const typeArguments: Type[] = [];
      if (extendedType.name === "Array")
        typeArguments.push(...(extendedType.typeArguments ?? []));

      const extension = IntrinsicExtension.get(object, ...typeArguments);
      let member = extension.members[<any>index];
      if (member instanceof Function && "intrinsicKind" in <object>member && (<any>member).intrinsicKind === Intrinsic.Kind.Function)
        member = new (<Intrinsic.FunctionCtor>member)(this);

      return member ?? realValue;
    }

    return realValue;
  }

  public visitCallExpression(expr: CallExpression): ValueType {
    const fn = <Callable>this.evaluate(expr.callee);
    const fitsArity = typeof fn.arity === "number" ? expr.args.length === fn.arity : fn.arity.doesFit(expr.args.length);
    if (!fitsArity)
      throw new RuntimeError(`Expected call to '${fn.name}()' to have ${fn.arity.toString()} arguments, got ${expr.args.length}`, expr.callee.token);

    const args = expr.args.map(arg => this.evaluate(arg));
    if (fn instanceof PFunction)
      return fn.call(this, ...args);
    else
      return fn.call(...args);
  }

  public visitPropertyAssignmentExpression(expr: PropertyAssignmentExpression): ValueType {
    const value = this.evaluate(expr.value);
    const object = this.evaluate(expr.access.object);
    const index = this.evaluate(expr.access.index);
    (<any[]>object)[<number>index] = value; // modify to work with objects, any[] | Record and number | string
    return value;
  }

  public visitVariableAssignmentExpression(expr: VariableAssignmentExpression): ValueType {
    const value = this.evaluate(expr.value);
    this.scope.assign(expr.identifier.name, value);
    return value;
  }

  public visitCompoundAssignmentExpression(expr: CompoundAssignmentExpression): ValueType {
    const operatorSyntaxName = Syntax[expr.operator.syntax];
    const fixedOperator = new Token(
      <Syntax><unknown>Syntax[<number><unknown>operatorSyntaxName.replace(/Equal/, "")],
      expr.operator.lexeme.replace(/=/, ""),
      undefined,
      expr.operator.locationSpan
    );

    const binary = new BinaryExpression(expr.left, expr.right, fixedOperator);
    const assignment = expr.left instanceof IdentifierExpression ?
      new VariableAssignmentExpression(expr.left, binary)
      : new PropertyAssignmentExpression(expr.left, binary);

    return this.evaluate(assignment);
  }

  public visitIdentifierExpression(expr: IdentifierExpression): ValueType {
    return this.lookupVariable(expr.name);
  }

  private lookupVariable(name: Token<undefined>): ValueType {
    return this.scope.get(name);
  }

  public visitTernaryExpression(expr: TernaryExpression): ValueType {
    return this.evaluate(expr.condition) ?
      this.evaluate(expr.body)
      : this.evaluate(expr.elseBranch);
  }

  public visitUnaryExpression(expr: UnaryExpression): ValueType {
    const operand = this.evaluate(expr.operand);
    const one = new LiteralExpression(fakeToken(Syntax.Int, "1", 1));
    switch(expr.operator.syntax) {
      case Syntax.Bang:
        if (typeof operand !== "boolean")
          return operand === undefined;
        else
          return !operand
      case Syntax.Tilde:
        return ~<number>operand;
      case Syntax.Plus:
        return +<number>operand;
      case Syntax.Minus:
        return -<number>operand;
      case Syntax.Hashtag:
        return (<ArrayLike<any>>operand).length;
      case Syntax.PlusPlus: {
        const compoundOperator = fakeToken<undefined>(Syntax.PlusEqual, "+=");
        const compoundAssignment = new CompoundAssignmentExpression(<IdentifierExpression>expr.operand, one, compoundOperator);
        return this.evaluate(compoundAssignment);
      }
      case Syntax.MinusMinus: {
        const compoundOperator = fakeToken<undefined>(Syntax.MinusEqual, "-=");
        const compoundAssignment = new CompoundAssignmentExpression(<IdentifierExpression>expr.operand, one, compoundOperator);
        return this.evaluate(compoundAssignment);
      }

      default:
        throw new RuntimeError(`(BUG) Unhandled unary operator: ${expr.operator.lexeme}`, expr.operator);
    }
  }

  public visitBinaryExpression(expr: BinaryExpression): ValueType {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);
    switch(expr.operator.syntax) {
      case Syntax.Plus:
        return <string & number>left + <string & number>right;
      case Syntax.Minus:
        return <number>left - <number>right;
      case Syntax.Star:
        if (typeof left === "number")
          return <number>left * <number>right;
        else
          return (<string>left).repeat(<number>right);
      case Syntax.Slash:
        if (typeof left === "number")
          return <number>left / <number>right;
        else
          return (<string>left).split(<string>right);
      case Syntax.SlashSlash:
        return Math.floor(<number>left / <number>right);
      case Syntax.StarStar:
      case Syntax.Carat:
        return (<number>left) ** <number>right;
      case Syntax.Percent:
        return <number>left % <number>right;
      case Syntax.Ampersand:
        return <number>left & <number>right;
      case Syntax.Pipe:
        return <number>left | <number>right;
      case Syntax.Tilde:
        return <number>left ^ <number>right;
      case Syntax.LDoubleArrow:
        return <number>left << <number>right;
      case Syntax.RDoubleArrow:
        return <number>left >> <number>right;
      case Syntax.EqualEqual:
        return left === right;
      case Syntax.BangEqual:
        return left !== right;
      case Syntax.LT:
        return <number>left < <number>right;
      case Syntax.LTE:
        return <number>left <= <number>right;
      case Syntax.GT:
        return <number>left > <number>right;
      case Syntax.GTE:
        return <number>left >= <number>right;
      case Syntax.QuestionQuestion:
        return left ?? right;
      case Syntax.AmpersandAmpersand:
        return left && right;
      case Syntax.PipePipe:
        return left || right;

      default:
        throw new RuntimeError(`(BUG) Unhandled binary operator: ${expr.operator.lexeme}`, expr.operator);
    }
  }

  public visitParenthesizedExpression(expr: ParenthesizedExpression): ValueType {
    return this.evaluate(expr.expression);
  }

  public visitStringInterpolationExpression(expr: StringInterpolationExpression): ValueType {
    return expr.parts.map(part =>
      part === undefined ?
        "undefined"
        : (part === null ?
          "null"
          : this.evaluate(part)!.toString()
        )
    ).join("");
  }

  public visitObjectLiteralExpression(expr: ObjectLiteralExpression): ObjectType {
    const object: ObjectType = {};
    for (const [key, value] of expr.properties)
      object[<IndexValueType>this.evaluate(key)] = this.evaluate(value);

    return object;
  }

  public visitArrayLiteralExpression(expr: ArrayLiteralExpression): ValueType[] {
    return expr.elements.map(element => this.evaluate(element));
  }

  public visitRangeLiteralExpression(expr: RangeLiteralExpression): Range {
    const minimum = <number>this.evaluate(expr.minimum);
    const maximum = <number>this.evaluate(expr.maximum);
    return new Range(minimum, maximum);
  }

  public visitLiteralExpression<V extends TypeLiteralValueType | null | undefined = TypeLiteralValueType | null | undefined>(expr: LiteralExpression<V>): V {
    return expr.token.value;
  }

  public defineArgv(argv: string[]): void {
    this.intrinsics.define("argv", argv, new ArrayType(new SingularType("string")));
    this.definedArgv = true;
  }

  public startRecursion(token: Token<undefined>): void {
    this.recursionDepth++;
    if (this.recursionDepth < this.maxRecursionDepth) return;
    throw new RuntimeError(`Stack overflow: Recursion depth of ${this.maxRecursionDepth} exceeded`, token);
  }

  public endRecursion(level = 1): void {
    this.recursionDepth -= level;
  }

  public executeBlock(block: BlockStatement, scope: Scope): void  {
    const enclosing = this.scope;
    try {
      this.scope = scope;
      for (const statement of block.members)
        this.execute(statement);
    } finally {
      this.scope = enclosing;
    }
  }

  public execute(statement: AST.Statement): void {
    this.evaluate(statement);
  }

  public evaluate<T extends AST.Expression | AST.Statement = AST.Expression | AST.Statement>(statements: T | AST.Statement[]): ValueType {
    if (statements instanceof AST.Node)
      return statements.accept(this);
    else {
      let lastResult: ValueType;
      for (const statement of statements)
        lastResult = statement.accept(this);

      return lastResult;
    }
  }
}