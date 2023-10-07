import type { Token } from "../../../tokenization/token";
import AST from "..";

export class RangeLiteralExpression extends AST.Expression {
  public constructor(
    public readonly minimum: AST.Expression,
    public readonly maximum: AST.Expression,
    public readonly operator: Token<undefined>
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Expression<R>): R {
    return visitor.visitRangeLiteralExpression(this);
  }

  public get token(): Token<undefined> {
    return this.operator;
  }
}