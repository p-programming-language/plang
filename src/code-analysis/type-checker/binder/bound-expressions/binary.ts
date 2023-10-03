import { BoundExpression } from "../bound-node";
import type { BoundBinaryOperator } from "../bound-operators/binary";

export default class BoundBinaryExpression extends BoundExpression {
  public override readonly type = this.operator.resultType;

  public constructor(
    public readonly left: BoundExpression,
    public readonly right: BoundExpression,
    public readonly operator: BoundBinaryOperator
  ) { super(); }
}