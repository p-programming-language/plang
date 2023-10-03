import AST from "../parser/ast";
import BoundLiteralExpression from "./binder/bound-expressions/literal";
import BoundParenthesizedExpression from "./binder/bound-expressions/parenthesized";
import BoundBinaryExpression from "./binder/bound-expressions/binary";
import BoundUnaryExpression from "./binder/bound-expressions/unary";
import BoundIdentifierExpression from "./binder/bound-expressions/identifier";
import BoundVariableDeclarationStatement from "./binder/bound-statements/variable-declaration";
import BoundCompoundAssignmentExpression from "./binder/bound-expressions/compound-assignment";
import BoundVariableAssignmentExpression from "./binder/bound-expressions/variable-assignment";
import BoundVariableAssignmentStatement from "./binder/bound-statements/variable-assignment";
import BoundExpressionStatement from "./binder/bound-statements/expression";
import { BoundExpression, BoundStatement } from "./binder/bound-node";

export type ValueType = string | number | boolean | null | undefined;

export class TypeChecker implements AST.Visitor.BoundExpression<void>, AST.Visitor.BoundStatement<void> {
  public visitVariableDeclarationStatement(stmt: BoundVariableDeclarationStatement): void {
    throw new Error("Method not implemented.");
  }

  public visitVariableAssignmentStatement(stmt: BoundVariableAssignmentStatement): void {
    throw new Error("Method not implemented.");
  }

  public visitExpressionStatement(stmt: BoundExpressionStatement): void {
    throw new Error("Method not implemented.");
  }

  public visitVariableAssignmentExpression(expr: BoundVariableAssignmentExpression): void {
    throw new Error("Method not implemented.");
  }

  public visitCompoundAssignmentExpression(expr: BoundCompoundAssignmentExpression): void {
    throw new Error("Method not implemented.");
  }

  public visitIdentifierExpression(expr: BoundIdentifierExpression): void {
    throw new Error("Method not implemented.");
  }

  public visitUnaryExpression(expr: BoundUnaryExpression): void {
    throw new Error("Method not implemented.");
  }

  public visitBinaryExpression(expr: BoundBinaryExpression): void {
    throw new Error("Method not implemented.");
  }

  public visitParenthesizedExpression(expr: BoundParenthesizedExpression): void {
    throw new Error("Method not implemented.");
  }

  public visitLiteralExpression<T extends ValueType = ValueType>(expr: BoundLiteralExpression<T>): void {
    throw new Error("Method not implemented.");
  }

  // public check<T extends BoundExpression | BoundStatement = BoundExpression | BoundStatement>(node: T): void {
  //   node.accept(this);
  // }
}

