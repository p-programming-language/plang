import { BoundExpression } from "../bound-node";
import type { BoundBinaryOperator } from "../bound-operators/binary";
import type { Token } from "../../../syntax/token";
import AST from "../../../parser/ast";

export default class BoundBinaryExpression extends BoundExpression {
  public override readonly type = this.operator.resultType;

  public constructor(
    public readonly left: BoundExpression,
    public readonly right: BoundExpression,
    public readonly operator: BoundBinaryOperator
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundExpression<R>): R {
    return visitor.visitBinaryExpression(this);
  }

  public get token(): Token {
    return this.left.token;
  }
}