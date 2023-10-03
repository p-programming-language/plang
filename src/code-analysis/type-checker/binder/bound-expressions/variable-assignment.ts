import { BoundExpression } from "../bound-node";
import type BoundIdentifierExpression from "./identifier";

export default class BoundVariableAssignmentExpression extends BoundExpression {
  public override readonly type = this.value.type;

  public constructor(
    public readonly name: BoundIdentifierExpression,
    public readonly value: BoundExpression
  ) { super(); }
}