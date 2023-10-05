import { BoundExpression } from "../bound-node";
import type { Token } from "../../../syntax/token";
import AST from "../../../parser/ast";

export default class BoundCallExpression extends BoundExpression {
  public override readonly type = this.callee.type;

  public constructor(
    public readonly callee: BoundExpression,
    public readonly args: BoundExpression[]
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundExpression<R>): R {
    return visitor.visitCallExpression(this);
  }

  public get token(): Token {
    return this.callee.token;
  }
}