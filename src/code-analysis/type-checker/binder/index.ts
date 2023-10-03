
import type { LiteralExpression } from "../../parser/ast/expressions/literal";
import type { ParenthesizedExpression } from "../../parser/ast/expressions/parenthesized";
import type { BinaryExpression } from "../../parser/ast/expressions/binary";
import type { UnaryExpression } from "../../parser/ast/expressions/unary";
import type { IdentifierExpression } from "../../parser/ast/expressions/identifier";
import type { CompoundAssignmentExpression } from "../../parser/ast/expressions/compound-assignment";
import type { VariableAssignmentExpression } from "../../parser/ast/expressions/variable-assignment";
import type { ExpressionStatement } from "../../parser/ast/statements/expression";
import type { VariableAssignmentStatement } from "../../parser/ast/statements/variable-assignment";
import type { VariableDeclarationStatement } from "../../parser/ast/statements/variable-declaration";
import { BoundBinaryOperator } from "./bound-operators/binary";
import { BoundUnaryOperator } from "./bound-operators/unary";
import type { BoundExpression, BoundStatement } from "./bound-node";
import type { Token } from "../../syntax/token";
import type { Type } from "../types/type";
import type { ValueType } from "..";

import SingularType from "../types/singular-type";
import Syntax from "../../syntax/syntax-type";
import AST from "../../parser/ast";
import VariableSymbol from "../variable-symbol";
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

export class Binder implements AST.Visitor.Expression<BoundExpression>, AST.Visitor.Statement<BoundStatement> {
  private readonly variables: VariableSymbol[] = [];

  public visitVariableDeclarationStatement(expr: VariableDeclarationStatement): BoundVariableDeclarationStatement {
    const name = expr.identifier.name.lexeme;
    const initializer = expr.initializer ? this.bind(expr.initializer) : undefined;
    const variableSymbol = new VariableSymbol(name, initializer?.type ?? new SingularType("undefined"));
    this.variables.push(variableSymbol);
    return new BoundVariableDeclarationStatement(variableSymbol, initializer);
  }

  public visitVariableAssignmentStatement(stmt: VariableAssignmentStatement): BoundVariableAssignmentStatement {
    const identifier = <BoundIdentifierExpression>this.bind(stmt.identifier);
    const value = this.bind(stmt.value);
    return new BoundVariableAssignmentStatement(identifier, value);
  }

  public visitExpressionStatement(stmt: ExpressionStatement): BoundExpressionStatement {
    return new BoundExpressionStatement(this.bind(stmt.expression));
  }

  public visitVariableAssignmentExpression(expr: VariableAssignmentExpression): BoundVariableAssignmentExpression {
    const identifier = <BoundIdentifierExpression>this.bind(expr.identifier);
    const value = this.bind(expr.value);
    return new BoundVariableAssignmentExpression(identifier, value);
  }

  public visitCompoundAssignmentExpression(expr: CompoundAssignmentExpression): BoundCompoundAssignmentExpression {
    const left = <BoundIdentifierExpression>this.bind(expr.left); // | BoundAccessExpression
    const right = this.bind(expr.right);
    const boundOperator = BoundBinaryOperator.get(expr.operator.syntax);
    return new BoundCompoundAssignmentExpression(left, right, boundOperator);
  }

  public visitIdentifierExpression(expr: IdentifierExpression): BoundIdentifierExpression {
    const variableSymbol = this.findSymbol(expr.name);
    return new BoundIdentifierExpression(expr.name.lexeme, variableSymbol.type);
  }

  public visitUnaryExpression(expr: UnaryExpression): BoundUnaryExpression {
    const operand = this.bind(expr.operand);
    const boundOperator = BoundUnaryOperator.get(expr.operator.syntax);
    return new BoundUnaryExpression(operand, boundOperator);
  }

  public visitBinaryExpression(expr: BinaryExpression): BoundBinaryExpression {
    const left = this.bind(expr.left);
    const right = this.bind(expr.right);
    const boundOperator = BoundBinaryOperator.get(expr.operator.syntax);
    return new BoundBinaryExpression(left, right, boundOperator);
  }

  public visitParenthesizedExpression(expr: ParenthesizedExpression): BoundParenthesizedExpression {
    return new BoundParenthesizedExpression(this.bind(expr.expression));
  }

  public visitLiteralExpression<T extends ValueType = ValueType>(expr: LiteralExpression<T>): BoundLiteralExpression<T> {
    const type = this.getTypeFromSyntax(expr.token.syntax)!;
    return new BoundLiteralExpression(expr.token.value, type);
  }

  public bindStatements(statements: AST.Statement[]): BoundStatement[] {
    return statements.map(statement => this.bind(statement));
  }

  private bind<T extends AST.Expression | AST.Statement = AST.Expression | AST.Statement>(node: T): T extends AST.Expression ? BoundExpression : BoundStatement {
    if (node instanceof AST.Expression)
      return node.accept<BoundExpression>(this);
    else
      return <T extends AST.Expression ? BoundExpression : BoundStatement>node.accept<BoundStatement>(this);
  }

  private findSymbol(name: Token): VariableSymbol {
    return this.variables
      .find(symbol => symbol.name === name.lexeme)!;
  }

  private getTypeFromSyntax(syntax: Syntax): Type | undefined {
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