import { BoundExpression } from "../bound-node";
import type { BoundBinaryOperator } from "../bound-operators/binary";
import type BoundIdentifierExpression from "./identifier";

export default class BoundCompoundAssignmentExpression extends BoundExpression {
  public override readonly type = this.left.type;

  public constructor(
    public readonly left: BoundIdentifierExpression, // | BoundAccessExpression
    public readonly right: BoundExpression,
    public readonly operator: BoundBinaryOperator
  ) { super(); }
}