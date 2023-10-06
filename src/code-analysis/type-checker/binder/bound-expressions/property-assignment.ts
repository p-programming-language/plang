import { BoundExpression } from "../bound-node";
import type { Token } from "../../../tokenization/token";
import BoundIndexExpression from ".";
import AST from "../../../parser/ast";

export default class BoundPropertyAssignmentExpression extends BoundExpression {
  public override readonly type = this.value.type;

  public constructor(
    public readonly access: BoundIndexExpression,
    public readonly value: BoundExpression
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundExpression<R>): R {
    return visitor.visitPropertyAssignmentExpression(this);
  }

  public get token(): Token {
    return this.access.token;
  }
}