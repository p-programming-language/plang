import { BoundExpression, BoundStatement } from "../bound-node";

export default class BoundExpressionStatement extends BoundStatement {
  public override readonly type = this.expression.type;

  public constructor(
    public readonly expression: BoundExpression
  ) { super(); }
}