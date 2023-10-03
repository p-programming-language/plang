import { BoundExpression } from "../bound-node";
import type { BoundUnaryOperator } from "../bound-operators/unary";

export default class BoundUnaryExpression extends BoundExpression {
  public override readonly type = this.operator.resultType;

  public constructor(
    public readonly operand: BoundExpression,
    public readonly operator: BoundUnaryOperator
  ) { super(); }
}