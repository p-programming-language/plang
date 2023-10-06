import { BoundExpression, BoundStatement } from "../bound-node";
import type { Token } from "../../../tokenization/token";
import AST from "../../../parser/ast";

export default class BoundReturnStatement extends BoundStatement {
  public override readonly type = this.expression.type;

  public constructor(
    public readonly token: Token<undefined>,
    public readonly expression: BoundExpression
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundStatement<R>): R {
    return visitor.visitReturnStatement(this);
  }
}