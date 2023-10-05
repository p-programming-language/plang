import { BindingError } from "../../../errors";
import type { BoundExpression, BoundStatement } from "./bound-node";
import type { Token } from "../../syntax/token";
import type { Type } from "../types/type";
import type { ValueType } from "..";
import { BoundBinaryOperator } from "./bound-operators/binary";
import { BoundUnaryOperator } from "./bound-operators/unary";
import VariableSymbol from "./variable-symbol";
import SingularType from "../types/singular-type";
import UnionType from "../types/union-type";
import ArrayType from "../types/array-type";
import Syntax from "../../syntax/syntax-type";
import AST from "../../parser/ast";

import type { LiteralExpression } from "../../parser/ast/expressions/literal";
import type { ArrayLiteralExpression } from "../../parser/ast/expressions/array-literal";
import type { ParenthesizedExpression } from "../../parser/ast/expressions/parenthesized";
import type { UnaryExpression } from "../../parser/ast/expressions/unary";
import type { BinaryExpression } from "../../parser/ast/expressions/binary";
import type { TernaryExpression } from "../../parser/ast/expressions/ternary";
import { IdentifierExpression } from "../../parser/ast/expressions/identifier";
import type { CompoundAssignmentExpression } from "../../parser/ast/expressions/compound-assignment";
import type { VariableAssignmentExpression } from "../../parser/ast/expressions/variable-assignment";
import type { PropertyAssignmentExpression } from "../../parser/ast/expressions/property-assignment";
import { SingularTypeExpression } from "../../parser/ast/type-nodes/singular-type";
import { UnionTypeExpression } from "../../parser/ast/type-nodes/union-type";
import { ArrayTypeExpression } from "../../parser/ast/type-nodes/array-type";
import type { CallExpression } from "../../parser/ast/expressions/call";
import { IndexExpression } from "../../parser/ast/expressions";
import type { ExpressionStatement } from "../../parser/ast/statements/expression";
import type { PrintlnStatement } from "../../parser/ast/statements/println";
import type { VariableAssignmentStatement } from "../../parser/ast/statements/variable-assignment";
import { VariableDeclarationStatement } from "../../parser/ast/statements/variable-declaration";
import type { BlockStatement } from "../../parser/ast/statements/block";
import type { IfStatement } from "../../parser/ast/statements/if";
import type { WhileStatement } from "../../parser/ast/statements/while";
import type { FunctionDeclarationStatement } from "../../parser/ast/statements/function-declaration";
import type { ReturnStatement } from "../../parser/ast/statements/return";

import BoundLiteralExpression from "./bound-expressions/literal";
import BoundArrayLiteralExpression from "./bound-expressions/array-literal";
import BoundParenthesizedExpression from "./bound-expressions/parenthesized";
import BoundUnaryExpression from "./bound-expressions/unary";
import BoundBinaryExpression from "./bound-expressions/binary";
import BoundTernaryExpression from "./bound-expressions/ternary";
import BoundIdentifierExpression from "./bound-expressions/identifier";
import BoundCompoundAssignmentExpression from "./bound-expressions/compound-assignment";
import BoundVariableAssignmentExpression from "./bound-expressions/variable-assignment";
import BoundPropertyAssignmentExpression from "./bound-expressions/property-assignment";
import BoundCallExpression from "./bound-expressions/call";
import BoundIndexExpression from "./bound-expressions";
import BoundExpressionStatement from "./bound-statements/expression";
import BoundPrintlnStatement from "./bound-statements/println";
import BoundVariableAssignmentStatement from "./bound-statements/variable-assignment";
import BoundVariableDeclarationStatement from "./bound-statements/variable-declaration";
import BoundBlockStatement from "./bound-statements/block";
import BoundIfStatement from "./bound-statements/if";
import BoundWhileStatement from "./bound-statements/while";
import BoundFunctionDeclarationStatement from "./bound-statements/function-declaration";
import FunctionType from "../types/function-type";
import BoundReturnStatement from "./bound-statements/return";

export default class Binder implements AST.Visitor.Expression<BoundExpression>, AST.Visitor.Statement<BoundStatement> {
  private readonly variables: VariableSymbol[] = [];

  public visitReturnStatement(stmt: ReturnStatement): BoundReturnStatement {
    const expr = this.bind(stmt.expression);
    return new BoundReturnStatement(stmt.token, expr);
  }

  public visitFunctionDeclarationStatement(stmt: FunctionDeclarationStatement): BoundFunctionDeclarationStatement {
    const returnType = this.getTypeFromTypeRef(stmt.returnType);
    const type = new FunctionType(
      new Map<string, Type>(stmt.parameters.map(param => [param.identifier.name.lexeme, this.getTypeFromTypeRef(param.type)])),
      returnType
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
    const boundStatements = this.bindStatements(stmt.statements);
    return new BoundBlockStatement(stmt.token, boundStatements);
  }

  public visitVariableDeclarationStatement(stmt: VariableDeclarationStatement): BoundVariableDeclarationStatement {
    const initializer = stmt.initializer ? this.bind(stmt.initializer) : undefined;
    const variableSymbol = this.defineSymbol(stmt.identifier.token, this.getTypeFromTypeRef(stmt.type));
    return new BoundVariableDeclarationStatement(variableSymbol, stmt.mutable, initializer);
  }

  public visitVariableAssignmentStatement(stmt: VariableAssignmentStatement): BoundVariableAssignmentStatement {
    const identifier = <BoundIdentifierExpression>this.bind(stmt.identifier);
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

  public visitIndexExpression(expr: IndexExpression): BoundExpression {
    const object = this.bind(expr.object);
    const index = this.bind(expr.index);
    return new BoundIndexExpression(expr.token, object, index);
  }

  public visitCallExpression(expr: CallExpression): BoundCallExpression {
    const callee = this.bind(expr.callee);
    const args = expr.args.map(arg => this.bind(arg));
    return new BoundCallExpression(callee, args);
  }

  public visitPropertyAssignmentExpression(expr: PropertyAssignmentExpression): BoundPropertyAssignmentExpression {
    const access = this.bind<IndexExpression, BoundIndexExpression>(expr.access);
    const value = this.bind(expr.value);
    return new BoundPropertyAssignmentExpression(access, value);
  }

  public visitVariableAssignmentExpression(expr: VariableAssignmentExpression): BoundVariableAssignmentExpression {
    const identifier = this.bind<IdentifierExpression, BoundIdentifierExpression>(expr.identifier);
    const variableSymbol = new VariableSymbol(identifier.token, identifier.type);
    const value = this.bind(expr.value);
    return new BoundVariableAssignmentExpression(variableSymbol, value);
  }

  public visitCompoundAssignmentExpression(expr: CompoundAssignmentExpression): BoundCompoundAssignmentExpression {
    const left = this.bind<IdentifierExpression | IndexExpression, BoundIdentifierExpression | BoundIndexExpression>(expr.left); // | BoundAccessExpression
    const right = this.bind(expr.right);
    const boundOperator = BoundBinaryOperator.get(expr.operator, left.type, right.type);
    return new BoundCompoundAssignmentExpression(left, right, boundOperator);
  }

  public visitIdentifierExpression(expr: IdentifierExpression): BoundIdentifierExpression {
    const variableSymbol = this.findSymbol(expr.token);
    if (!variableSymbol)
      throw new BindingError(`Failed to find variable symbol for '${expr.token.lexeme}'`, expr.token)

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

  public visitLiteralExpression<T extends ValueType = ValueType>(expr: LiteralExpression<T>): BoundLiteralExpression<T> {
    const type = this.getTypeFromLiteralSyntax(expr.token.syntax)!;
    return new BoundLiteralExpression(expr.token, type);
  }

  public bindStatements(statements: AST.Statement[]): BoundStatement[] {
    return statements.map(statement => this.bind(statement));
  }

  public defineSymbol<T extends Type = Type>(name: Token, type: T): VariableSymbol<T> {
    const variableSymbol = new VariableSymbol<T>(name, type);
    this.variables.push(variableSymbol);
    return variableSymbol;
  }

  private bind<T extends AST.Expression | AST.Statement = AST.Expression | AST.Statement, R extends BoundExpression | BoundStatement = T extends AST.Expression ? BoundExpression : BoundStatement>(node: T): R {
    return <R>(node instanceof AST.Expression ?
      node.accept<BoundExpression>(this)
      : node.accept<BoundStatement>(this));
  }

  private findSymbol(name: Token): VariableSymbol {
    return this.variables
      .find(symbol => symbol.name.lexeme === name.lexeme)!;
  }

  private getTypeFromTypeRef(node: AST.TypeRef): Type {
    if (node instanceof SingularTypeExpression)
      return new SingularType(node.token.lexeme, node.typeArguments?.map(arg => this.getTypeFromTypeRef(arg)));
    else if (node instanceof UnionTypeExpression)
      return new UnionType(node.types.map(singular => <SingularType>this.getTypeFromTypeRef(singular)));
    else if (node instanceof ArrayTypeExpression)
      return new ArrayType(this.getTypeFromTypeRef(node.elementType));

    throw new BindingError(`Unhandled type expression: ${node}`, node.token);
  }

  private getTypeFromLiteralSyntax(syntax: Syntax): Type | undefined {
    switch(syntax) {
      case Syntax.String:
        return new SingularType("string");
      case Syntax.Int:
        return new SingularType("int");
      case Syntax.Float:
        return new SingularType("float");
      case Syntax.Boolean:
        return new SingularType("bool");
      case Syntax.Undefined:
        return new SingularType("undefined");
      case Syntax.Null:
        return new SingularType("null");
    }
  }
}