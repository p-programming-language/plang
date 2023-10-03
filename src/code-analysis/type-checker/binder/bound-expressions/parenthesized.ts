import { BoundExpression } from "../bound-node";
import AST from "../../../parser/ast";

export default class BoundParenthesizedExpression extends BoundExpression {
  public override readonly type = this.expression.type;

  public constructor(
    public readonly expression: BoundExpression
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundExpression<R>): R {
    return visitor.visitParenthesizedExpression(this);
  }
}