import AST from "../parser/ast";
import { LiteralExpression } from "../parser/ast/expressions/literal";
import { ParenthesizedExpression } from "../parser/ast/expressions/parenthesized";
import { BinaryExpression } from "../parser/ast/expressions/binary";
import { UnaryExpression } from "../parser/ast/expressions/unary";

export type ValueType = string | number | boolean | null | undefined;

export class TypeChecker implements AST.Visitor.Expression<void>, AST.Visitor.Statement<void> {
  public visitUnaryExpression(expr: UnaryExpression): void {
    throw new Error("Method not implemented.");
  }

  public visitBinaryExpression(expr: BinaryExpression): void {
    throw new Error("Method not implemented.");
  }

  public visitParenthesizedExpression(expr: ParenthesizedExpression): void {
    throw new Error("Method not implemented.");
  }

  public visitLiteralExpression(expr: LiteralExpression<ValueType>): void {
    throw new Error("Method not implemented.");
  }
}

