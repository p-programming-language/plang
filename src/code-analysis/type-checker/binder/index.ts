import util from "util";

import { LiteralExpression } from "../../parser/ast/expressions/literal";
import { ParenthesizedExpression } from "../../parser/ast/expressions/parenthesized";
import { BinaryExpression } from "../../parser/ast/expressions/binary";
import { UnaryExpression } from "../../parser/ast/expressions/unary";
import { ValueType } from "..";

import { BoundLiteralExpression } from "./bound-expressions/literal";
import { BoundParenthesizedExpression } from "./bound-expressions/parenthesized";
import { BoundBinaryExpression } from "./bound-expressions/binary";
import { BoundBinaryOperator } from "./bound-operators/binary";
import { BoundUnaryExpression } from "./bound-expressions/unary";
import { BoundUnaryOperator } from "./bound-operators/unary";

import Syntax from "../../syntax/syntax-type";
import AST from "../../parser/ast";
import Type from "../types/type";
import SingularType from "../types/singular-type";

export abstract class BoundNode {
  public toString(): string {
    return util.inspect(this, { colors: true, compact: false });
  }
}

export abstract class BoundExpression extends BoundNode {
  public abstract type: Type;
}
export abstract class BoundStatement extends BoundNode {}

export class Binder implements AST.Visitor.Expression<BoundExpression>, AST.Visitor.Statement<BoundStatement> {
  public visitUnaryExpression(expr: UnaryExpression): BoundExpression {
    const operand = this.bind(expr.operand);
    const boundOperator = BoundUnaryOperator.bind(expr.operator.syntax, operand.type);
    return new BoundUnaryExpression(operand, boundOperator);
  }

  public visitBinaryExpression(expr: BinaryExpression): BoundExpression {
    const left = this.bind(expr.left);
    const right = this.bind(expr.right);
    const boundOperator = BoundBinaryOperator.bind(expr.operator.syntax, left.type, right.type);
    return new BoundBinaryExpression(left, right, boundOperator);
  }

  public visitParenthesizedExpression(expr: ParenthesizedExpression): BoundParenthesizedExpression {
    return new BoundParenthesizedExpression(this.bind(expr.expression));
  }

  public visitLiteralExpression<T extends ValueType = ValueType>(expr: LiteralExpression<T>): BoundLiteralExpression<T> {
    const type = this.getTypeFromSyntax(expr.token.syntax)!;
    return new BoundLiteralExpression(expr.token.value, type);
  }

  private bind<T extends AST.Expression | AST.Statement = AST.Expression | AST.Statement>(node: T): T extends AST.Expression ? BoundExpression : BoundStatement {
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