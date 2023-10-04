import { BindingError } from "../../../errors";
import type { BoundExpression, BoundStatement } from "./bound-node";
import type { Token } from "../../syntax/token";
import type { Type, TypeName } from "../types/type";
import type { ValueType } from "..";
import { BoundBinaryOperator } from "./bound-operators/binary";
import { BoundUnaryOperator } from "./bound-operators/unary";
import VariableSymbol from "../variable-symbol";
import SingularType from "../types/singular-type";
import UnionType from "../types/union-type";
import Syntax from "../../syntax/syntax-type";
import AST from "../../parser/ast";

import type { LiteralExpression } from "../../parser/ast/expressions/literal";
import type { ParenthesizedExpression } from "../../parser/ast/expressions/parenthesized";
import type { BinaryExpression } from "../../parser/ast/expressions/binary";
import type { UnaryExpression } from "../../parser/ast/expressions/unary";
import type { IdentifierExpression } from "../../parser/ast/expressions/identifier";
import type { CompoundAssignmentExpression } from "../../parser/ast/expressions/compound-assignment";
import type { VariableAssignmentExpression } from "../../parser/ast/expressions/variable-assignment";
import { SingularTypeExpression } from "../../parser/ast/type-nodes/singular-type";
import { UnionTypeExpression } from "../../parser/ast/type-nodes/union-type";
import type { ExpressionStatement } from "../../parser/ast/statements/expression";
import type { VariableAssignmentStatement } from "../../parser/ast/statements/variable-assignment";
import type { VariableDeclarationStatement } from "../../parser/ast/statements/variable-declaration";

import BoundLiteralExpression from "./bound-expressions/literal";
import BoundParenthesizedExpression from "./bound-expressions/parenthesized";
import BoundBinaryExpression from "./bound-expressions/binary";
import BoundUnaryExpression from "./bound-expressions/unary";
import BoundIdentifierExpression from "./bound-expressions/identifier";
import BoundCompoundAssignmentExpression from "./bound-expressions/compound-assignment";
import BoundVariableAssignmentExpression from "./bound-expressions/variable-assignment";
import BoundExpressionStatement from "./bound-statements/expression";
import BoundVariableAssignmentStatement from "./bound-statements/variable-assignment";
import BoundVariableDeclarationStatement from "./bound-statements/variable-declaration";

export default class Binder implements AST.Visitor.Expression<BoundExpression>, AST.Visitor.Statement<BoundStatement> {
  private readonly variables: VariableSymbol[] = [];

  public visitVariableDeclarationStatement(stmt: VariableDeclarationStatement): BoundVariableDeclarationStatement {
    const initializer = stmt.initializer ? this.bind(stmt.initializer) : undefined;
    const variableSymbol = new VariableSymbol(stmt.identifier.name, this.getTypeFromTypeNode(stmt.type));
    this.variables.push(variableSymbol);
    return new BoundVariableDeclarationStatement(variableSymbol, initializer);
  }

  public visitVariableAssignmentStatement(stmt: VariableAssignmentStatement): BoundVariableAssignmentStatement {
    const identifier = <BoundIdentifierExpression>this.bind(stmt.identifier);
    const variableSymbol = new VariableSymbol(identifier.name, identifier.type);
    const value = this.bind(stmt.value);
    return new BoundVariableAssignmentStatement(variableSymbol, value);
  }

  public visitExpressionStatement(stmt: ExpressionStatement): BoundExpressionStatement {
    return new BoundExpressionStatement(this.bind(stmt.expression));
  }

  public visitVariableAssignmentExpression(expr: VariableAssignmentExpression): BoundVariableAssignmentExpression {
    const identifier = <BoundIdentifierExpression>this.bind(expr.identifier);
    const variableSymbol = new VariableSymbol(identifier.name, identifier.type);
    const value = this.bind(expr.value);
    return new BoundVariableAssignmentExpression(variableSymbol, value);
  }

  public visitCompoundAssignmentExpression(expr: CompoundAssignmentExpression): BoundCompoundAssignmentExpression {
    const left = <BoundIdentifierExpression>this.bind(expr.left); // | BoundAccessExpression
    const right = this.bind(expr.right);
    const boundOperator = BoundBinaryOperator.get(expr.operator);
    return new BoundCompoundAssignmentExpression(left, right, boundOperator);
  }

  public visitIdentifierExpression(expr: IdentifierExpression): BoundIdentifierExpression {
    const variableSymbol = this.findSymbol(expr.name);
    return new BoundIdentifierExpression(expr.name, variableSymbol.type);
  }

  public visitUnaryExpression(expr: UnaryExpression): BoundUnaryExpression {
    const operand = this.bind(expr.operand);
    const boundOperator = BoundUnaryOperator.get(expr.operator);
    return new BoundUnaryExpression(operand, boundOperator);
  }

  public visitBinaryExpression(expr: BinaryExpression): BoundBinaryExpression {
    const left = this.bind(expr.left);
    const right = this.bind(expr.right);
    const boundOperator = BoundBinaryOperator.get(expr.operator);
    return new BoundBinaryExpression(left, right, boundOperator);
  }

  public visitParenthesizedExpression(expr: ParenthesizedExpression): BoundParenthesizedExpression {
    return new BoundParenthesizedExpression(this.bind(expr.expression));
  }

  public visitLiteralExpression<T extends ValueType = ValueType>(expr: LiteralExpression<T>): BoundLiteralExpression<T> {
    const type = this.getTypeFromLiteralSyntax(expr.token.syntax)!;
    return new BoundLiteralExpression(expr.token, type);
  }

  public bindStatements(statements: AST.Statement[]): BoundStatement[] {
    return statements.map(statement => this.bind(statement));
  }

  private bind<T extends AST.Expression | AST.Statement = AST.Expression | AST.Statement>(node: T): T extends AST.Expression ? BoundExpression : BoundStatement {
    return <T extends AST.Expression ? BoundExpression : BoundStatement>(node instanceof AST.Expression ?
      node.accept<BoundExpression>(this)
      : node.accept<BoundStatement>(this));
  }

  private findSymbol(name: Token): VariableSymbol {
    return this.variables
      .find(symbol => symbol.name.lexeme === name.lexeme)!;
  }

  private getTypeFromTypeNode(node: AST.TypeNode): Type {
    if (node instanceof SingularTypeExpression)
      return new SingularType(<TypeName>node.token.lexeme);
    else if (node instanceof UnionTypeExpression)
      return new UnionType(node.types.map(singular => <SingularType>this.getTypeFromTypeNode(singular)));

    throw new BindingError(`Unhandled type expression: ${node}`, node.token)
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