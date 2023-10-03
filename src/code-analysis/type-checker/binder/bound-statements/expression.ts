import { BoundExpression, BoundStatement } from "../bound-node";
import AST from "../../../parser/ast";

export default class BoundExpressionStatement extends BoundStatement {
  public override readonly type = this.expression.type;

  public constructor(
    public readonly expression: BoundExpression
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundStatement<R>): R {
    return visitor.visitExpressionStatement(this);
  }
}