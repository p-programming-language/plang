import { BoundExpression } from "../bound-node";
import type { Token } from "../../tokenization/token";
import type AST from "../../parser/ast";
import type SingularType from "../../type-checker/types/singular-type";

export default class BoundRangeLiteralExpression extends BoundExpression {
  public constructor(
    public readonly operator: Token<undefined>,
    public readonly minimum: BoundExpression,
    public readonly maximum: BoundExpression,
    public readonly type: SingularType<"Range">
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundExpression<R>): R {
    return visitor.visitRangeLiteralExpression(this);
  }

  public get token(): Token<undefined> {
    return this.operator;
  }
}