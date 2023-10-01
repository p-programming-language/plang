import { BoundExpression } from "..";

export class BoundParenthesizedExpression extends BoundExpression {
  public override type = this.expression.type;

  public constructor(
    public readonly expression: BoundExpression
  ) { super(); }
}