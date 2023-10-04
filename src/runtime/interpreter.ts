import { RuntimeError } from "../errors";
import type { ValueType } from "../code-analysis/type-checker";
import Syntax from "../code-analysis/syntax/syntax-type";
import AST from "../code-analysis/parser/ast";

import type { LiteralExpression } from "../code-analysis/parser/ast/expressions/literal";
import type { ParenthesizedExpression } from "../code-analysis/parser/ast/expressions/parenthesized";
import type { UnaryExpression } from "../code-analysis/parser/ast/expressions/unary";
import type { BinaryExpression } from "../code-analysis/parser/ast/expressions/binary";
import type { IdentifierExpression } from "../code-analysis/parser/ast/expressions/identifier";
import type { CompoundAssignmentExpression } from "../code-analysis/parser/ast/expressions/compound-assignment";
import type { VariableAssignmentExpression } from "../code-analysis/parser/ast/expressions/variable-assignment";
import type { ExpressionStatement } from "../code-analysis/parser/ast/statements/expression";
import type { VariableAssignmentStatement } from "../code-analysis/parser/ast/statements/variable-assignment";
import type { VariableDeclarationStatement } from "../code-analysis/parser/ast/statements/variable-declaration";

export default class Interpreter implements AST.Visitor.Expression<ValueType>, AST.Visitor.Statement<void> {
  public visitVariableDeclarationStatement(stmt: VariableDeclarationStatement): void {

  }

  public visitVariableAssignmentStatement(stmt: VariableAssignmentStatement): void {

  }

  public visitExpressionStatement(stmt: ExpressionStatement): ValueType {
    return this.evaluate(stmt.expression);
  }

  public visitVariableAssignmentExpression(expr: VariableAssignmentExpression): void {

  }

  public visitCompoundAssignmentExpression(expr: CompoundAssignmentExpression): void {

  }

  public visitIdentifierExpression(expr: IdentifierExpression): ValueType {
    return // return variable in scope
  }

  public visitUnaryExpression(expr: UnaryExpression): ValueType {
    const operand = this.evaluate(expr.operand);
    switch(expr.operator.syntax) {
      case Syntax.Bang:
        return !operand;
      case Syntax.Tilde:
        return ~<number>operand;
      case Syntax.Plus:
        return +<number>operand;
      case Syntax.Minus:
        return -<number>operand;
      case Syntax.PlusPlus:
        return; // assignment operators
      case Syntax.MinusMinus:
        return;

      default:
        throw new RuntimeError(`(BUG) Unhandled unary operator: ${expr.operator.lexeme}`, expr.operator);
    }
  }

  public visitBinaryExpression(expr: BinaryExpression): ValueType {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);
    switch(expr.operator.syntax) {
      case Syntax.Plus:
        return <string & number>left + <string & number>right;
      case Syntax.Minus:
        return <number>left + <number>right;
      case Syntax.Star:
        if (typeof left === "number")
          return <number>left * <number>right;
        else
          return (<string>left).repeat(<number>right);
      case Syntax.Slash:
        // if (typeof left === "number")
          return <number>left / <number>right;
        // else
        //   return (<string>left).split(<string>right);
      case Syntax.SlashSlash:
        return Math.floor(<number>left / <number>right);
      case Syntax.Carat:
        return (<number>left) ** <number>right;
      case Syntax.Percent:
        return <number>left % <number>right;
      case Syntax.Ampersand:
        return <number>left & <number>right;
      case Syntax.Pipe:
        return <number>left | <number>right;
      case Syntax.Tilde:
        return <number>left ^ <number>right;
      case Syntax.LDoubleArrow:
        return <number>left << <number>right;
      case Syntax.RDoubleArrow:
        return <number>left >> <number>right;
      case Syntax.EqualEqual:
        return left === right;
      case Syntax.BangEqual:
        return left !== right;
      case Syntax.LT:
        return <number>left > <number>right;
      case Syntax.LTE:
        return <number>left <= <number>right;
      case Syntax.GT:
        return <number>left > <number>right;
      case Syntax.GTE:
        return <number>left >= <number>right;
      case Syntax.QuestionQuestion:
        return left ?? right;
      case Syntax.AmpersandAmpersand:
        return left && right;
      case Syntax.PipePipe:
        return left || right;

      default:
        throw new RuntimeError(`(BUG) Unhandled binary operator: ${expr.operator.lexeme}`, expr.operator);
    }
  }

  public visitParenthesizedExpression(expr: ParenthesizedExpression): ValueType {
    return this.evaluate(expr.expression);
  }

  public visitLiteralExpression<V extends ValueType = ValueType>(expr: LiteralExpression<V>): V {
    return expr.token.value;
  }

  public evaluate<T extends AST.Expression | AST.Statement = AST.Expression | AST.Statement>(statements: T | AST.Statement[]): ValueType {
    if (statements instanceof Array) {
      let lastResult: ValueType;
      for (const statement of statements)
        lastResult = statement.accept(this);

      return lastResult;
    } else
      return statements.accept(this);
  }
}