import { RuntimeError } from "../errors";
import type { IndexValueType, ObjectType, TypeLiteralValueType, ValueType } from "../code-analysis/type-checker";
import type { Callable } from "./values/callable";
import type { Type } from "../code-analysis/type-checker/types/type";
import { INTRINSIC_EXTENDED_LITERAL_VALUE_TYPES } from "../code-analysis/type-checker/types/type-sets";
import { Token } from "../code-analysis/tokenization/token";
import { Range } from "./values/range";
import { fakeToken } from "../utility";
import type Binder from "../code-analysis/binder";
import type Resolver from "../code-analysis/resolver";
import type P from "../../tools/p";
import type BoundIsExpression from "../code-analysis/binder/bound-expressions/is";
import type BoundTypeOfExpression from "../code-analysis/binder/bound-expressions/typeof";
import SingularType from "../code-analysis/type-checker/types/singular-type";
import LiteralType from "../code-analysis/type-checker/types/literal-type";
import UnionType from "../code-analysis/type-checker/types/union-type";
import Syntax from "../code-analysis/tokenization/syntax-type";
import Scope from "./scope";
import HookedException from "./hooked-exceptions";
import Intrinsics from "./intrinsics";
import PFunction from "./values/function";
import Intrinsic from "./values/intrinsic";
import IntrinsicExtension from "./intrinsics/literal-extensions";
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
import type { ExpressionStatement } from "../code-analysis/parser/ast/statements/expression";
import type { PrintlnStatement } from "../code-analysis/parser/ast/statements/println";
import type { VariableAssignmentStatement } from "../code-analysis/parser/ast/statements/variable-assignment";
import type { VariableDeclarationStatement } from "../code-analysis/parser/ast/statements/variable-declaration";
import type { BlockStatement } from "../code-analysis/parser/ast/statements/block";
import type { IfStatement } from "../code-analysis/parser/ast/statements/if";
import type { WhileStatement } from "../code-analysis/parser/ast/statements/while";
import type { FunctionDeclarationStatement } from "../code-analysis/parser/ast/statements/function-declaration";
import type { ReturnStatement } from "../code-analysis/parser/ast/statements/return";

const MAX_RECURSION_DEPTH = 1200;

export default class Interpreter implements AST.Visitor.Expression<ValueType>, AST.Visitor.Statement<void> {
  public readonly globals = new Scope;
  public scope = this.globals;

  private loopLevel = 0;
  private recursionDepth = 1;
  private readonly intrinsics = new Intrinsics(this);

  public constructor(
    public readonly runner: P,
    public readonly resolver: Resolver,
    public readonly binder: Binder,
    public fileName = "unnamed"
  ) {
    this.intrinsics.inject();
  }

  public visitTypeDeclarationStatement(): void {
    // do nothing
  }

  public visitReturnStatement(stmt: ReturnStatement): void {
    const value = this.evaluate(stmt.expression);
    throw new HookedException.Return(stmt.token, value);
  }

  public visitFunctionDeclarationStatement(stmt: FunctionDeclarationStatement): void {
    const fn = new PFunction(stmt, this.scope);
    this.scope.define(stmt.name, fn, {
      mutable: false
    });
  }

  public visitWhileStatement(stmt: WhileStatement): void {
    this.loopLevel++;
    const inverted = stmt.token.syntax === Syntax.Until;
    let depth = 0;

    while (inverted ? !this.evaluate(stmt.condition) : this.evaluate(stmt.condition)) {
      this.startRecursion(stmt.token);
      this.execute(stmt.body);
      depth++;
    }

    this.endRecursion(depth);
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
    this.evaluate(stmt.statements);
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

  public visitPrintlnStatement(stmt: PrintlnStatement): void {
    console.log(...stmt.expressions.map(expr => this.evaluate(expr)).map(value => value?.toString()));
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
      return type.types.map(t => this.getTypeName(t)).join(" | ");
    else
      return (<SingularType>type).name;
  }

  public visitIndexExpression(expr: AccessExpression): ValueType {
    const object = this.evaluate(expr.object);
    const index = this.evaluate(expr.index);
    if (object instanceof Intrinsic.Lib)
      return object.members[<any>index];

    const realValue = (<ValueType[] | ObjectType>object)[<any>index];
    if (INTRINSIC_EXTENDED_LITERAL_VALUE_TYPES.includes(typeof object)) {
      const extension = IntrinsicExtension.get(object);
      return extension.members[<any>index] ?? realValue;
    }

    return realValue;
  }

  public visitCallExpression(expr: CallExpression): ValueType {
    const fn = <Callable>this.evaluate(expr.callee);
    const fitsArity = typeof fn.arity === "number" ? expr.args.length === fn.arity : fn.arity.doesFit(expr.args.length);
    if (!fitsArity)
      throw new RuntimeError(`Expected call to '${fn.name}()' to have ${fn.arity.toString()} arguments, got ${expr.args.length}`, expr.callee.token)

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

  public startRecursion(token: Token<undefined>): void {
    this.recursionDepth++;
    if (this.recursionDepth < MAX_RECURSION_DEPTH) return;
    throw new RuntimeError(`Stack overflow: Recursion depth of ${MAX_RECURSION_DEPTH} exceeded`, token);
  }

  public endRecursion(level = 1): void {
    this.recursionDepth -= level;
  }

  public executeBlock(block: BlockStatement, scope: Scope): void  {
    const enclosing = this.scope;
    try {
      this.scope = scope;
      for (const statement of block.statements)
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