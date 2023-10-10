import { BindingError, TypeError } from "../../errors";
import { INDEX_TYPE, INTRINSIC_EXTENDED_LITERAL_TYPES } from "../type-checker/types/type-sets";
import { BoundBinaryOperator } from "./bound-operators/binary";
import { BoundUnaryOperator } from "./bound-operators/unary";
import { getTypeFromTypeRef } from "../../utility";
import type { Token } from "../tokenization/token";
import type { Type } from "../type-checker/types/type";
import type { BoundExpression, BoundNode, BoundStatement } from "./bound-node";
import type { InterfaceMemberSignature, TypeLiteralValueType } from "../type-checker";
import type TypeTracker from "../parser/type-tracker";
import Intrinsic from "../../runtime/values/intrinsic";
import IntrinsicExtension from "../../runtime/intrinsics/value-extensions";
import VariableSymbol from "./variable-symbol";
import SingularType from "../type-checker/types/singular-type";
import LiteralType from "../type-checker/types/literal-type";
import UnionType from "../type-checker/types/union-type";
import FunctionType from "../type-checker/types/function-type";
import ArrayType from "../type-checker/types/array-type";
import InterfaceType from "../type-checker/types/interface-type";
import ClassType from "../type-checker/types/class-type";
import Syntax from "../tokenization/syntax-type";
import AST from "../parser/ast";

import { LiteralExpression } from "../parser/ast/expressions/literal";
import type { StringInterpolationExpression } from "../parser/ast/expressions/string-interpolation";
import type { RangeLiteralExpression } from "../parser/ast/expressions/range-literal";
import type { ArrayLiteralExpression } from "../parser/ast/expressions/array-literal";
import type { ObjectLiteralExpression } from "../parser/ast/expressions/object-literal";
import type { ParenthesizedExpression } from "../parser/ast/expressions/parenthesized";
import type { UnaryExpression } from "../parser/ast/expressions/unary";
import type { BinaryExpression } from "../parser/ast/expressions/binary";
import type { TernaryExpression } from "../parser/ast/expressions/ternary";
import { IdentifierExpression } from "../parser/ast/expressions/identifier";
import type { CompoundAssignmentExpression } from "../parser/ast/expressions/compound-assignment";
import type { VariableAssignmentExpression } from "../parser/ast/expressions/variable-assignment";
import type { PropertyAssignmentExpression } from "../parser/ast/expressions/property-assignment";
import type { CallExpression } from "../parser/ast/expressions/call";
import { AccessExpression } from "../parser/ast/expressions/access";
import type { TypeOfExpression } from "../parser/ast/expressions/typeof";
import type { IsExpression } from "../parser/ast/expressions/is";
import type { IsInExpression } from "../parser/ast/expressions/is-in";
import type { NewExpression } from "../parser/ast/expressions/new";
import type { ExpressionStatement } from "../parser/ast/statements/expression";
import type { VariableAssignmentStatement } from "../parser/ast/statements/variable-assignment";
import { VariableDeclarationStatement } from "../parser/ast/statements/variable-declaration";
import { BlockStatement } from "../parser/ast/statements/block";
import type { IfStatement } from "../parser/ast/statements/if";
import type { WhileStatement } from "../parser/ast/statements/while";
import type { FunctionDeclarationStatement } from "../parser/ast/statements/function-declaration";
import type { ReturnStatement } from "../parser/ast/statements/return";
import type { TypeDeclarationStatement } from "../parser/ast/statements/type-declaration";
import type { UseStatement } from "../parser/ast/statements/use";
import type { BreakStatement } from "../parser/ast/statements/break";
import type { NextStatement } from "../parser/ast/statements/next";
import type { EveryStatement } from "../parser/ast/statements/every";
import type { ClassDeclarationStatement } from "../parser/ast/statements/class-declaration";
import type { ClassBodyStatement } from "../parser/ast/statements/class-body";
import type { MethodDeclarationStatement } from "../parser/ast/statements/method-declaration";
import type { PropertyDeclarationStatement } from "../parser/ast/statements/property-declaration";

import type { BoundClassMember } from "../parser/ast/classifications/class-member";
import BoundLiteralExpression from "./bound-expressions/literal";
import BoundStringInterpolationExpression from "./bound-expressions/string-interpolation";
import BoundRangeLiteralExpression from "./bound-expressions/range-literal";
import BoundArrayLiteralExpression from "./bound-expressions/array-literal";
import BoundObjectLiteralExpression from "./bound-expressions/object-literal";
import BoundParenthesizedExpression from "./bound-expressions/parenthesized";
import BoundUnaryExpression from "./bound-expressions/unary";
import BoundBinaryExpression from "./bound-expressions/binary";
import BoundTernaryExpression from "./bound-expressions/ternary";
import BoundIdentifierExpression from "./bound-expressions/identifier";
import BoundCompoundAssignmentExpression from "./bound-expressions/compound-assignment";
import BoundVariableAssignmentExpression from "./bound-expressions/variable-assignment";
import BoundPropertyAssignmentExpression from "./bound-expressions/property-assignment";
import BoundCallExpression from "./bound-expressions/call";
import BoundAccessExpression from "./bound-expressions/access";
import BoundTypeOfExpression from "./bound-expressions/typeof";
import BoundIsExpression from "./bound-expressions/is";
import BoundIsInExpression from "./bound-expressions/is-in";
import BoundNewExpression from "./bound-expressions/new";
import BoundExpressionStatement from "./bound-statements/expression";
import BoundVariableAssignmentStatement from "./bound-statements/variable-assignment";
import BoundVariableDeclarationStatement from "./bound-statements/variable-declaration";
import BoundBlockStatement from "./bound-statements/block";
import BoundIfStatement from "./bound-statements/if";
import BoundWhileStatement from "./bound-statements/while";
import BoundFunctionDeclarationStatement from "./bound-statements/function-declaration";
import BoundReturnStatement from "./bound-statements/return";
import BoundTypeDeclarationStatement from "./bound-statements/type-declaration";
import BoundUseStatement from "./bound-statements/use";
import BoundEveryStatement from "./bound-statements/every";
import BoundBreakStatement from "./bound-statements/break";
import BoundNextStatement from "./bound-statements/next";
import BoundClassBodyStatement from "./bound-statements/class-body";
import BoundClassDeclarationStatement from "./bound-statements/class-declaration";
import BoundPropertyDeclarationStatement from "./bound-statements/property-declaration";
import BoundMethodDeclarationStatement from "./bound-statements/method-declaration";

type IndexType = SingularType<"string"> | SingularType<"int">;
type PropertyPair = [LiteralType<string>, InterfaceMemberSignature<Type>];

enum Context {
  Global,
  Parameters
}

export default class Binder implements AST.Visitor.Expression<BoundExpression>, AST.Visitor.Statement<BoundStatement> {
  private readonly variableScopes: VariableSymbol[][] = [];
  private readonly boundNodes = new Map<AST.Node, BoundNode>;
  private context = Context.Global;

  public constructor(
    private readonly typeTracker: TypeTracker
  ) {
    this.beginScope();
  }

  public visitMethodDeclarationStatement(stmt: MethodDeclarationStatement): BoundMethodDeclarationStatement {
    const enclosingContext = this.context;
    this.context = Context.Parameters;
    const parameters = stmt.parameters.map(param => this.bind<VariableDeclarationStatement, BoundVariableDeclarationStatement>(param));
    this.context = enclosingContext;

    const body = this.bind<BlockStatement, BoundBlockStatement>(stmt.body);
    const type = new FunctionType(
      new Map(parameters.map(decl => [decl.symbol.name.lexeme, decl.type])),
      getTypeFromTypeRef(this.typeTracker, stmt.returnType)
    );

    return new BoundMethodDeclarationStatement(stmt.modifiers, stmt.name, type, parameters, body);
  }

  public visitPropertyDeclarationStatement(stmt: PropertyDeclarationStatement): BoundPropertyDeclarationStatement {
    const name = stmt.identifier.name;
    const type = getTypeFromTypeRef(this.typeTracker, stmt.typeRef);
    const initializer = stmt.initializer ? this.bind(stmt.initializer) : undefined;
    return new BoundPropertyDeclarationStatement(stmt.modifiers, name, type, stmt.mutable, initializer);
  }

  public visitClassBodyStatement(stmt: ClassBodyStatement): BoundClassBodyStatement {
    const boundStatements = this.bindStatements<BoundClassMember>(stmt.members);
    return new BoundClassBodyStatement(stmt.token, boundStatements);
  }

  public visitClassDeclarationStatement(stmt: ClassDeclarationStatement): BoundClassDeclarationStatement {
    const superclassType = (stmt.superclass ? this.findSymbol(stmt.superclass.name) : undefined)?.type;
    const mixinTypes = stmt.mixins
      ?.map(mixin => this.findSymbol(mixin.name))
      ?.map(symbol => symbol.type);

    const body = this.bind<ClassBodyStatement, BoundClassBodyStatement>(stmt.body);
    const type = new ClassType(
      stmt.name.lexeme,
      new Map(body.members.map(stmt => [new LiteralType<string>(stmt.name.lexeme), {
        modifiers: stmt.modifiers,
        valueType: stmt.type,
        mutable: stmt instanceof BoundPropertyDeclarationStatement ? stmt.mutable : false
      }])),
      mixinTypes,
      superclassType
    )

    const symbol = this.defineSymbol(stmt.name, type);
    return new BoundClassDeclarationStatement(stmt.keyword, symbol, body, mixinTypes);
  }

  public visitEveryStatement(stmt: EveryStatement): BoundEveryStatement {
    const elementDeclarations = stmt.elementDeclarations
      .map(elementDeclaration => this.bind<VariableDeclarationStatement, BoundVariableDeclarationStatement>(elementDeclaration));

    const iterator = this.bind(stmt.iterable);
    const body = this.bind(stmt.body);
    return new BoundEveryStatement(stmt.token, elementDeclarations, iterator, body);
  }

  public visitNextStatement(stmt: NextStatement): BoundStatement {
    return new BoundNextStatement(stmt.token);
  }

  public visitBreakStatement(stmt: BreakStatement): BoundBreakStatement {
    return new BoundBreakStatement(stmt.token);
  }

  public visitUseStatement(stmt: UseStatement): BoundUseStatement {
    return new BoundUseStatement(stmt.keyword, stmt.members, stmt.location);
  }

  public visitTypeDeclarationStatement(stmt: TypeDeclarationStatement): BoundTypeDeclarationStatement {
    const symbol = this.defineSymbol(stmt.name, getTypeFromTypeRef(this.typeTracker, stmt.typeRef));
    return new BoundTypeDeclarationStatement(symbol);
  }

  public visitReturnStatement(stmt: ReturnStatement): BoundReturnStatement {
    const expr = this.bind(stmt.expression);
    return new BoundReturnStatement(stmt.token, expr);
  }

  public visitFunctionDeclarationStatement(stmt: FunctionDeclarationStatement): BoundFunctionDeclarationStatement {
    const type = new FunctionType(
      new Map<string, Type>(stmt.parameters.map(param => [param.identifier.name.lexeme, getTypeFromTypeRef(this.typeTracker, param.typeRef)])),
      getTypeFromTypeRef(this.typeTracker, stmt.returnType)
    );

    const variableSymbol = this.defineSymbol(stmt.name, type);
    const enclosingContext = this.context;
    this.context = Context.Parameters;
    const parameters = stmt.parameters.map(param => this.bind<VariableDeclarationStatement, BoundVariableDeclarationStatement>(param));
    this.context = enclosingContext;

    const body = this.bind<BlockStatement, BoundBlockStatement>(stmt.body);
    return new BoundFunctionDeclarationStatement(variableSymbol, parameters, body);
  }

  public visitWhileStatement(stmt: WhileStatement): BoundWhileStatement {
    const condition = this.bind(stmt.condition);
    const body = this.bind(stmt.body);
    return new BoundWhileStatement(stmt.token, condition, body);
  }

  public visitIfStatement(stmt: IfStatement): BoundIfStatement {
    const condition = this.bind(stmt.condition);
    const body = this.bind(stmt.body);
    const elseBranch = stmt.elseBranch ? this.bind(stmt.elseBranch) : undefined;
    return new BoundIfStatement(stmt.token, condition, body, elseBranch);
  }

  public visitBlockStatement(stmt: BlockStatement): BoundBlockStatement {
    this.beginScope();
    const boundStatements = this.bindStatements(stmt.members);
    this.endScope();
    return new BoundBlockStatement(stmt.token, boundStatements);
  }

  public visitVariableDeclarationStatement(stmt: VariableDeclarationStatement): BoundVariableDeclarationStatement {
    const initializer = stmt.initializer ? this.bind(stmt.initializer) : undefined;
    const variableType = getTypeFromTypeRef(this.typeTracker, stmt.typeRef);
    let type: Type;

    const valueIsUndefined = (initializer?.type ?? new SingularType("undefined")).isUndefined() && this.context !== Context.Parameters;
    if (valueIsUndefined)
      type = variableType instanceof UnionType ?
        new UnionType([...variableType.types, new SingularType("undefined")])
        : new UnionType([<SingularType>variableType, new SingularType("undefined")])
    else if (variableType.isSingular())
      if (variableType.name === "any")
        type = initializer?.type ?? variableType
      else
        type = variableType
    else
      type = variableType

    const variableSymbol = this.defineSymbol(stmt.identifier.token, type);
    return new BoundVariableDeclarationStatement(variableSymbol, stmt.mutable, initializer);
  }

  public visitVariableAssignmentStatement(stmt: VariableAssignmentStatement): BoundVariableAssignmentStatement {
    const identifier = this.bind<IdentifierExpression, BoundIdentifierExpression>(stmt.identifier);
    const variableSymbol = this.defineSymbol(identifier.name, identifier.type);
    const value = this.bind(stmt.value);
    return new BoundVariableAssignmentStatement(variableSymbol, value);
  }

  public visitExpressionStatement(stmt: ExpressionStatement): BoundExpressionStatement {
    return new BoundExpressionStatement(this.bind(stmt.expression));
  }

  public visitNewExpression(expr: NewExpression): BoundNewExpression {
    const classRef = this.bind<IdentifierExpression, BoundIdentifierExpression>(expr.classRef);
    const args = expr.constructorArgs.map(arg => this.bind(arg));
    return new BoundNewExpression(expr.token, classRef, args);
  }

  public visitIsInExpression(expr: IsInExpression): BoundIsInExpression {
    const value = this.bind(expr.value);
    const object = this.bind(expr.object);
    return new BoundIsInExpression(value, object, expr.operator);
  }

  public visitIsExpression(expr: IsExpression): BoundIsExpression {
    const value = this.bind(expr.value);
    const type = getTypeFromTypeRef(this.typeTracker, expr.typeRef);
    return new BoundIsExpression(value, type, expr.operator);
  }

  public visitTypeOfExpression(expr: TypeOfExpression): BoundTypeOfExpression {
    const value = this.bind(expr.operand);
    return new BoundTypeOfExpression(expr.operator, value);
  }

  public visitIndexExpression(expr: AccessExpression): BoundExpression {
    const object = this.bind(expr.object);
    const index = this.bind(expr.index);
    if (
      INTRINSIC_EXTENDED_LITERAL_TYPES.some(type => object.type.is(type))
      && index instanceof BoundLiteralExpression
    ) {

      let extendedType = <SingularType>object.type;
      if (extendedType instanceof LiteralType)
        extendedType = SingularType.fromLiteral(extendedType);

      const extension = IntrinsicExtension.getFake(extendedType.name);
      const memberName = index.token.value;
      const member = extension.members[memberName];
      if (!Object.keys(extension.members).includes(memberName))
        return new BoundAccessExpression(expr.token, object, index);

      let type = extension.propertyTypes[memberName];
      if ("intrinsicKind" in <object>member && (<any>member).intrinsicKind === Intrinsic.Kind.Function) {
        const fn = new (<Intrinsic.FunctionCtor>member)();
        type = new FunctionType(new Map(Object.entries(fn.argumentTypes)), fn.returnType);
      } else if (member && !type)
        throw new BindingError(`${extension.constructor.name} member '${memberName}' is not an Intrinsic.Function, yet has no value in 'propertyTypes'`, expr.index.token);

      return new BoundAccessExpression(expr.token, object, index, type);
    }

    return new BoundAccessExpression(expr.token, object, index);
  }

  public visitCallExpression(expr: CallExpression): BoundCallExpression {
    const callee = this.bind(expr.callee);
    const args = expr.args.map(arg => this.bind(arg));
    const message = `Attempt to call '${callee.type.toString(false)}'`;

    // if we add lambdas we put that here too
    if (!(callee instanceof BoundIdentifierExpression || callee instanceof BoundAccessExpression))
      throw new TypeError(message, callee.token);

    if (!callee.type.isFunction() && !(callee.type.isSingular() && callee.type.name === "any"))
      throw new TypeError(message, callee.token);

    return new BoundCallExpression(callee, args);
  }

  public visitPropertyAssignmentExpression(expr: PropertyAssignmentExpression): BoundPropertyAssignmentExpression {
    const access = this.bind<AccessExpression, BoundAccessExpression>(expr.access);
    const value = this.bind(expr.value);

    if (
      access.object.type.isInterface()
      && access.index instanceof BoundLiteralExpression
      && access.object.type.members.get(access.index.token.value)?.mutable === false
    ) {
      throw new TypeError(`Attempt to assign to immutable property '${access.index.token.value}'`, expr.access.index.token)
    }

    return new BoundPropertyAssignmentExpression(access, value);
  }

  public visitVariableAssignmentExpression(expr: VariableAssignmentExpression): BoundVariableAssignmentExpression {
    const identifier = this.bind<IdentifierExpression, BoundIdentifierExpression>(expr.identifier);
    const variableSymbol = this.defineSymbol(identifier.name, identifier.type);
    const value = this.bind(expr.value);
    return new BoundVariableAssignmentExpression(variableSymbol, value);
  }

  public visitCompoundAssignmentExpression(expr: CompoundAssignmentExpression): BoundCompoundAssignmentExpression {
    const left = this.bind<IdentifierExpression | AccessExpression, BoundIdentifierExpression | BoundAccessExpression>(expr.left); // | BoundAccessExpression
    const right = this.bind(expr.right);
    const boundOperator = BoundBinaryOperator.get(expr.operator, left.type, right.type);
    return new BoundCompoundAssignmentExpression(left, right, boundOperator);
  }

  public visitIdentifierExpression(expr: IdentifierExpression): BoundIdentifierExpression {
    const variableSymbol = this.findSymbol(expr.token);
    return new BoundIdentifierExpression(expr.name, variableSymbol.type);
  }

  public visitTernaryExpression(expr: TernaryExpression): BoundTernaryExpression {
    const condition = this.bind(expr.condition);
    const body = this.bind(expr.body);
    const elseBranch = this.bind(expr.elseBranch);
    return new BoundTernaryExpression(expr.token, condition, body, elseBranch);
  }

  public visitUnaryExpression(expr: UnaryExpression): BoundUnaryExpression {
    let operand = this.bind(expr.operand);
    const boundOperator = BoundUnaryOperator.get(expr.operator, operand.type);
    return new BoundUnaryExpression(operand, boundOperator);
  }

  public visitBinaryExpression(expr: BinaryExpression): BoundBinaryExpression {
    const left = this.bind(expr.left);
    const right = this.bind(expr.right);
    const boundOperator = BoundBinaryOperator.get(expr.operator, left.type, right.type);
    return new BoundBinaryExpression(left, right, boundOperator);
  }

  public visitParenthesizedExpression(expr: ParenthesizedExpression): BoundParenthesizedExpression {
    return new BoundParenthesizedExpression(this.bind(expr.expression));
  }

  public visitStringInterpolationExpression(expr: StringInterpolationExpression): BoundStringInterpolationExpression {
    return new BoundStringInterpolationExpression(expr.parts.map(part => this.bind(part)));
  }

  public visitObjectLiteralExpression(expr: ObjectLiteralExpression): BoundObjectLiteralExpression {
    const properties = new Map<LiteralType<string> | BoundExpression, BoundExpression>();
    for (const [key, value] of expr.properties) {
      const boundKey = this.bind(key);
      let keyLiteral: LiteralType<string> | BoundExpression = boundKey;
      if (boundKey instanceof BoundIdentifierExpression)
        keyLiteral = new LiteralType(boundKey.name.lexeme)
      else if (boundKey instanceof BoundLiteralExpression && key.token.syntax === Syntax.String)
        keyLiteral = new LiteralType<string>(boundKey.token.value)

      properties.set(keyLiteral, this.bind(value));
    }

    // inferring interface type
    const indexSignatures = new Map<IndexType, Type>();

    const typeProperties = Array.from(properties.entries())
      .map(([key, value]): PropertyPair | undefined => {
        if (key instanceof LiteralType)
          return [key, {
            valueType: value.type,
            mutable: true
          }];
        else {
          if (!key.type.isAssignableTo(INDEX_TYPE))
            throw new BindingError("An index signature type must be 'string' or 'int'", key.token);

          indexSignatures.set(<IndexType>key.type, value.type);
        }
      })
      .filter((props): props is PropertyPair => props !== undefined);

    const type = new InterfaceType(new Map<LiteralType<string>, InterfaceMemberSignature<Type>>(typeProperties), indexSignatures);
    return new BoundObjectLiteralExpression(expr.token, properties, type);
  }

  public visitArrayLiteralExpression(expr: ArrayLiteralExpression): BoundExpression {
    const elements = expr.elements.map(element => this.bind(element));
    let elementType: Type = new SingularType("undefined");

    // inferring element type
    for (const element of elements) {
      if (elementType.isSingular() && elementType.name === "undefined") {
        elementType = element.type;
        continue;
      }

      if (elementType.isSingular() && elementType.name !== "undefined") {
        if (element.type.isSingular() && elementType.name !== element.type.name)
          elementType = new UnionType([elementType, element.type]);
        else if (element.type.isUnion())
          elementType = new UnionType([elementType, ...element.type.types]);

        continue;
      }

      if (elementType.isUnion())
        if (element.type.isSingular())
          elementType = new UnionType([...elementType.types, element.type]);
        else if (element.type.isUnion() && elementType.types.every((t, i) => t.name !== (<UnionType>element.type).types[i].name))
          elementType = new UnionType([...elementType.types, ...element.type.types]);
    }

    const type = new ArrayType(elementType);
    return new BoundArrayLiteralExpression(expr.token, elements, type);
  }

  public visitRangeLiteralExpression(expr: RangeLiteralExpression): BoundRangeLiteralExpression {
    const minimum = this.bind(expr.minimum);
    const maximum = this.bind(expr.maximum);
    if (!minimum.type.isSingular() || !minimum.type.isAssignableTo(new SingularType("int")))
      throw new TypeError(`Minimum value for range must be an 'int', got '${minimum.type.toString()}'`, minimum.token);
    if (!maximum.type.isSingular() || !maximum.type.isAssignableTo(new SingularType("int")))
      throw new TypeError(`Maximum value for range must be an 'int', got '${minimum.type.toString()}'`, minimum.token);

    const type = new SingularType("Range");
    return new BoundRangeLiteralExpression(expr.operator, minimum, maximum, type);
  }

  public visitLiteralExpression<T extends TypeLiteralValueType = TypeLiteralValueType>(expr: LiteralExpression<T>): BoundLiteralExpression<T> {
    const type = new LiteralType(expr.token.value);
    return new BoundLiteralExpression(expr.token, type);
  }

  public defineSymbol<T extends Type = Type>(name: Token<undefined, Syntax.Identifier>, type: T): VariableSymbol<T> {
    const variableSymbol = new VariableSymbol<T>(name, type);
    const scope = this.variableScopes.at(-1);
    scope?.push(variableSymbol);
    return variableSymbol;
  }

  public getBoundNode<BNode extends BoundNode = BoundNode, Node extends AST.Node = AST.Node>(node: Node): BNode {
    return <BNode>this.boundNodes.get(node)!;
  }

  public bindStatements<T extends BoundStatement = BoundStatement>(statements: AST.Statement[]): T[] {
    return statements.map(statement => this.bind(statement));
  }

  private bind<T extends AST.Expression | AST.Statement = AST.Expression | AST.Statement, R extends BoundExpression | BoundStatement = T extends AST.Expression ? BoundExpression : BoundStatement>(node: T): R {
    const boundNode = <R>(node instanceof AST.Expression ?
      node.accept<BoundExpression>(this)
      : node.accept<BoundStatement>(this));

    this.boundNodes.set(node, boundNode);
    return boundNode;
  }

  private beginScope(): void {
    this.variableScopes.push([]);
  }

  private endScope<T extends Type = Type>(): VariableSymbol<T>[] {
    return <VariableSymbol<T>[]>this.variableScopes.pop();
  }

  private findSymbol<T extends Type = Type>(name: Token<undefined, Syntax.Identifier>): VariableSymbol<T> {
    const symbol = this.variableScopes.flat().find(symbol => symbol.name.lexeme === name.lexeme);
    if (symbol)
      return <VariableSymbol<T>>symbol;

    throw new BindingError(`Failed to find variable symbol for '${name.lexeme}'`, name)
  }
}