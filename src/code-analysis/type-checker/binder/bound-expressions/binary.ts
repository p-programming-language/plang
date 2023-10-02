import { BoundExpression } from "../bound-node";
import { BoundBinaryOperator } from "../bound-operators/binary";

export default class BoundBinaryExpression extends BoundExpression {
  public override type = this.operator.resultType;

  public constructor(
    public readonly left: BoundExpression,
    public readonly right: BoundExpression,
    public readonly operator: BoundBinaryOperator
  ) { super(); }
}