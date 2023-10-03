import { BoundExpression, BoundStatement } from "../bound-node";
import type BoundIdentifierExpression from "../bound-expressions/identifier";

export default class BoundVariableAssignmentStatement extends BoundStatement {
  public override readonly type = this.value.type;

  public constructor(
    public readonly name: BoundIdentifierExpression,
    public readonly value: BoundExpression
  ) { super(); }
}