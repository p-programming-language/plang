import { StringBuilder } from "../lib/utilities";
import { ValueType } from "../code-analysis/type-checker";
import AST from "../code-analysis/parser/ast";

import { LiteralExpression } from "../code-analysis/parser/ast/expressions/literal";
import { ParenthesizedExpression } from "../code-analysis/parser/ast/expressions/parenthesized";
import { UnaryExpression } from "../code-analysis/parser/ast/expressions/unary";
import { BinaryExpression } from "../code-analysis/parser/ast/expressions/binary";
import { IdentifierExpression } from "../code-analysis/parser/ast/expressions/identifier";

export default class CodeGenerator extends StringBuilder implements AST.Visitor.Expression<void>, AST.Visitor.Statement<void> {
  public visitIdentifierExpression(expr: IdentifierExpression): void {
    throw new Error("Method not implemented.");
  }

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