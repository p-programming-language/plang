import { BoundExpression } from "..";
import { BoundUnaryOperator } from "../bound-operators/unary";

export class BoundUnaryExpression extends BoundExpression {
  public override type = this.operator.resultType;

  public constructor(
    public readonly operand: BoundExpression,
    public readonly operator: BoundUnaryOperator
  ) { super(); }
}