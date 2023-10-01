import { StringBuilder } from "../lib/utilities";
import AST from "../code-analysis/parser/ast";
import { LiteralExpression } from "../code-analysis/parser/ast/expressions/literal";
import { ParenthesizedExpression } from "../code-analysis/parser/ast/expressions/parenthesized";
import { ValueType } from "../code-analysis/type-checker";

export default class CodeGenerator extends StringBuilder implements AST.Visitor.Expression<void>, AST.Visitor.Statement<void> {
  public visitParenthesizedExpression(expr: ParenthesizedExpression): void {
    throw new Error("Method not implemented.");
  }

  public visitLiteralExpression(expr: LiteralExpression<ValueType>): void {
    throw new Error("Method not implemented.");
  }
}