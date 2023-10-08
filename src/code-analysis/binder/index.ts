import { BindingError, TypeError } from "../../errors";
import { INDEX_TYPE, INTRINSIC_EXTENDED_LITERAL_TYPES } from "../type-checker/types/type-sets";
import { BoundBinaryOperator } from "./bound-operators/binary";
import { BoundUnaryOperator } from "./bound-operators/unary";
import { getTypeFromTypeRef } from "../../utility";
import type { Token } from "../tokenization/token";
import type { Type } from "../type-checker/types/type";
import type { BoundExpression, BoundNode, BoundStatement } from "./bound-node";
import type { InterfacePropertySignature, TypeLiteralValueType } from "../type-checker";
import Intrinsic from "../../runtime/values/intrinsic";
import IntrinsicExtension from "../../runtime/intrinsics/literal-extensions";
import VariableSymbol from "./variable-symbol";
import SingularType from "../type-checker/types/singular-type";
import LiteralType from "../type-checker/types/literal-type";
import UnionType from "../type-checker/types/union-type";
import FunctionType from "../type-checker/types/function-type";
import InterfaceType from "../type-checker/types/interface-type";
import ArrayType from "../type-checker/types/array-type";
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
import type { IsExpression } from "../parser/ast/expressions/is";
import type { TypeOfExpression } from "../parser/ast/expressions/typeof";
import type { ExpressionStatement } from "../parser/ast/statements/expression";
import type { PrintlnStatement } from "../parser/ast/statements/println";
import type { VariableAssignmentStatement } from "../parser/ast/statements/variable-assignment";
import { VariableDeclarationStatement } from "../parser/ast/statements/variable-declaration";
import type { BlockStatement } from "../parser/ast/statements/block";
import type { IfStatement } from "../parser/ast/statements/if";
import type { WhileStatement } from "../parser/ast/statements/while";
import type { FunctionDeclarationStatement } from "../parser/ast/statements/function-declaration";
import type { ReturnStatement } from "../parser/ast/statements/return";
import type { TypeDeclarationStatement } from "../parser/ast/statements/type-declaration";

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
import BoundIsExpression from "./bound-expressions/is";
import BoundTypeOfExpression from "./bound-expressions/typeof";
import BoundExpressionStatement from "./bound-statements/expression";
import BoundPrintlnStatement from "./bound-statements/println";
import BoundVariableAssignmentStatement from "./bound-statements/variable-assignment";
import BoundVariableDeclarationStatement from "./bound-statements/variable-declaration";
import BoundBlockStatement from "./bound-statements/block";
import BoundIfStatement from "./bound-statements/if";
import BoundWhileStatement from "./bound-statements/while";
import BoundFunctionDeclarationStatement from "./bound-statements/function-declaration";
import BoundReturnStatement from "./bound-statements/return";
import BoundTypeDeclarationStatement from "./bound-statements/type-declaration";

type IndexType = SingularType<"string"> | SingularType<"int">;
type PropertyPair = [LiteralType<string>, InterfacePropertySignature<Type>];

export default class Binder implements AST.Visitor.Expression<BoundExpression>, AST.Visitor.Statement<BoundStatement> {
  private readonly variableScopes: VariableSymbol[][] = [];
  private readonly boundNodes = new Map<AST.Node, BoundNode>;

  public constructor() {
    this.beginScope();
  }

  public visitTypeDeclarationStatement(stmt: TypeDeclarationStatement): BoundTypeDeclarationStatement {
    const symbol = this.defineSymbol(stmt.name, getTypeFromTypeRef(stmt.typeRef));
    return new BoundTypeDeclarationStatement(symbol);
  }

  public visitReturnStatement(stmt: ReturnStatement): BoundReturnStatement {
    const expr = this.bind(stmt.expression);
    return new BoundReturnStatement(stmt.token, expr);
  }

  public visitFunctionDeclarationStatement(stmt: FunctionDeclarationStatement): BoundFunctionDeclarationStatement {
    const type = new FunctionType(
      new Map<string, Type>(stmt.parameters.map(param => [param.identifier.name.lexeme, getTypeFromTypeRef(param.typeRef)])),
      getTypeFromTypeRef(stmt.returnType)
    );

    const variableSymbol = this.defineSymbol(stmt.name, type);
    const parameters = stmt.parameters.map(param => this.bind<VariableDeclarationStatement, BoundVariableDeclarationStatement>(param));
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
    const boundStatements = this.bindStatements(stmt.statements);
    this.endScope();
    return new BoundBlockStatement(stmt.token, boundStatements);
  }

  public visitVariableDeclarationStatement(stmt: VariableDeclarationStatement): BoundVariableDeclarationStatement {
    const initializer = stmt.initializer ? this.bind(stmt.initializer) : undefined;
    const variableType = getTypeFromTypeRef(stmt.typeRef);
    let type: Type;

    const valueIsUndefined = (initializer?.type ?? new SingularType("undefined")).isUndefined();
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
    const variableSymbol = new VariableSymbol(identifier.token, identifier.type);
    const value = this.bind(stmt.value);
    return new BoundVariableAssignmentStatement(variableSymbol, value);
  }

  public visitPrintlnStatement(stmt: PrintlnStatement): BoundPrintlnStatement {
    return new BoundPrintlnStatement(stmt.token, stmt.expressions.map(expr => this.bind(expr)));
  }

  public visitExpressionStatement(stmt: ExpressionStatement): BoundExpressionStatement {
    return new BoundExpressionStatement(this.bind(stmt.expression));
  }

  public visitIndexExpression(expr: AccessExpression): BoundExpression {
    const object = this.bind(expr.object);
    const index = this.bind(expr.index);
    if (
      INTRINSIC_EXTENDED_LITERAL_TYPES.some(type => object.type.is(type))
      && index instanceof BoundLiteralExpression
    ) {

      const extension = IntrinsicExtension.getFake((<SingularType>object.type).name);
      const member = extension.members[index.token.value];
      let type: Type;
      if (member instanceof Intrinsic.Function)
        type = new FunctionType(new Map(Object.entries(member.argumentTypes)), member.returnType);
      else
        type = SingularType.fromValue(member);

      return new BoundAccessExpression(expr.token, object, index, type);
    }

    return new BoundAccessExpression(expr.token, object, index);
  }

  public visitIsExpression(expr: IsExpression): BoundIsExpression {
    const value = this.bind(expr.value);
    const type = getTypeFromTypeRef(expr.typeRef);
    return new BoundIsExpression(value, type, expr.operator);
  }

  public visitTypeOfExpression(expr: TypeOfExpression): BoundTypeOfExpression {
    const value = this.bind(expr.operand);
    return new BoundTypeOfExpression(expr.operator, value);
  }

  public visitCallExpression(expr: CallExpression): BoundCallExpression {
    const callee = this.bind(expr.callee);
    const args = expr.args.map(arg => this.bind(arg));
    const message = `Attempt to call '${callee.type.toString()}'`;

    // if we add lambdas we put that here too
    if (!(callee instanceof BoundIdentifierExpression || callee instanceof BoundAccessExpression))
      throw new TypeError(message, callee.token);

    if (!callee.type.isFunction() && (!callee.type.isSingular() || callee.type.name !== "any"))
      throw new TypeError(message, callee.token);

    return new BoundCallExpression(callee, args);
  }

  public visitPropertyAssignmentExpression(expr: PropertyAssignmentExpression): BoundPropertyAssignmentExpression {
    const access = this.bind<AccessExpression, BoundAccessExpression>(expr.access);
    const value = this.bind(expr.value);

    if (
      access.object.type.isInterface()
      && access.index instanceof BoundLiteralExpression
      && access.object.type.properties.get(access.index.token.value)?.mutable === false
    ) {
      throw new TypeError(`Attempt to assign to immutable property '${access.index.token.value}'`, expr.access.index.token)
    }

    return new BoundPropertyAssignmentExpression(access, value);
  }

  public visitVariableAssignmentExpression(expr: VariableAssignmentExpression): BoundVariableAssignmentExpression {
    const identifier = this.bind<IdentifierExpression, BoundIdentifierExpression>(expr.identifier);
    const variableSymbol = new VariableSymbol(identifier.token, identifier.type);
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

    const type = new InterfaceType(new Map<LiteralType<string>, InterfacePropertySignature<Type>>(typeProperties), indexSignatures);
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

  public defineSymbol<T extends Type = Type>(name: Token, type: T): VariableSymbol<T> {
    const variableSymbol = new VariableSymbol<T>(name, type);
    const scope = this.variableScopes.at(-1);
    scope?.push(variableSymbol);
    return variableSymbol;
  }

  public getBoundNode<BNode extends BoundNode = BoundNode, Node extends AST.Node = AST.Node>(node: Node): BNode {
    return <BNode>this.boundNodes.get(node)!;
  }

  public bindStatements(statements: AST.Statement[]): BoundStatement[] {
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

  private findSymbol(name: Token): VariableSymbol {
    const symbol = this.variableScopes.flat().find(symbol => symbol.name.lexeme === name.lexeme);
    if (symbol) return symbol;

    throw new BindingError(`Failed to find variable symbol for '${name.lexeme}'`, name)
  }
}