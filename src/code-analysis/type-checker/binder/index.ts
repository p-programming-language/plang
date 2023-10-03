
import { LiteralExpression } from "../../parser/ast/expressions/literal";
import { ParenthesizedExpression } from "../../parser/ast/expressions/parenthesized";
import { BinaryExpression } from "../../parser/ast/expressions/binary";
import { UnaryExpression } from "../../parser/ast/expressions/unary";
import { IdentifierExpression } from "../../parser/ast/expressions/identifier";
import { VariableDeclarationStatement } from "../../parser/ast/statements/variable-declaration";
import { BoundBinaryOperator } from "./bound-operators/binary";
import { BoundUnaryOperator } from "./bound-operators/unary";
import type { BoundExpression, BoundStatement } from "./bound-node";
import type { Type } from "../types/type";
import type { ValueType } from "..";

import SingularType from "../types/singular-type";
import Syntax from "../../syntax/syntax-type";
import AST from "../../parser/ast";
import BoundLiteralExpression from "./bound-expressions/literal";
import BoundParenthesizedExpression from "./bound-expressions/parenthesized";
import BoundBinaryExpression from "./bound-expressions/binary";
import BoundUnaryExpression from "./bound-expressions/unary";
import BoundIdentifierExpression from "./bound-expressions/identifier";
import BoundVariableDeclarationStatement from "./bound-statements/variable-declaration";
import VariableSymbol from "../variable-symbol";

export class Binder implements AST.Visitor.Expression<BoundExpression>, AST.Visitor.Statement<BoundStatement> {
  public visitVariableDeclarationStatement(expr: VariableDeclarationStatement): BoundVariableDeclarationStatement {
    // TODO: add to scope
    const name = expr.identifier.name.lexeme;
    const initializer = expr.initializer ? this.bind(expr.initializer) : undefined;
    const variableSymbol = new VariableSymbol(name, initializer?.type ?? new SingularType("undefined"));
    return new BoundVariableDeclarationStatement(variableSymbol, initializer);
  }

  public visitIdentifierExpression(expr: IdentifierExpression): BoundIdentifierExpression {
    // TODO: add an actual type to this, grabbing from the scope
    return new BoundIdentifierExpression(expr.name.lexeme, new SingularType("any"));
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

  public bind<T extends AST.Expression | AST.Statement = AST.Expression | AST.Statement>(node: T): T extends AST.Expression ? BoundExpression : BoundStatement {
    if (node instanceof AST.Expression)
      return node.accept<BoundExpression>(this);
    else
      return <T extends AST.Expression ? BoundExpression : BoundStatement>((<AST.Statement>node).accept<BoundStatement>(this));
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