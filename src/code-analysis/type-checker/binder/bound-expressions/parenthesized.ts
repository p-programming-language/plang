import { BoundExpression } from "../bound-node";

export default class BoundParenthesizedExpression extends BoundExpression {
  public override readonly type = this.expression.type;

  public constructor(
    public readonly expression: BoundExpression
  ) { super(); }
}