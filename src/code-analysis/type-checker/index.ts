import AST from "../parser/ast";
import BoundLiteralExpression from "./binder/bound-expressions/literal";
import BoundParenthesizedExpression from "./binder/bound-expressions/parenthesized";
import BoundBinaryExpression from "./binder/bound-expressions/binary";
import BoundUnaryExpression from "./binder/bound-expressions/unary";
import BoundIdentifierExpression from "./binder/bound-expressions/identifier";
import BoundVariableDeclarationExpression from "./binder/bound-expressions/variable-declaration";

export type ValueType = string | number | boolean | null | undefined;

export class TypeChecker implements AST.Visitor.BoundExpression<void>, AST.Visitor.BoundStatement<void> {
  public visitVariableDeclarationExpression(expr: BoundVariableDeclarationExpression): void {
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
}

