import { BoundExpression } from "../bound-node";
import type { Token } from "../../tokenization/token";
import type { BoundUnaryOperator } from "../bound-operators/unary";
import AST from "../../parser/ast";

export default class BoundUnaryExpression extends BoundExpression {
  public override readonly type = this.operator.resultType;

  public constructor(
    public readonly operand: BoundExpression,
    public readonly operator: BoundUnaryOperator
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundExpression<R>): R {
    return visitor.visitUnaryExpression(this);
  }

  public get token(): Token {
    return this.operand.token;
  }
}