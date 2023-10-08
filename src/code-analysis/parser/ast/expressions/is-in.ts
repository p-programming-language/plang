import type { Token } from "../../../tokenization/token";
import AST from "..";

export class IsInExpression extends AST.Expression {
  public constructor(
    public readonly value: AST.Expression,
    public readonly object: AST.Expression,
    public readonly inversed: boolean,
    public readonly operator: Token<undefined>
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Expression<R>): R {
    return visitor.visitIsInExpression(this);
  }

  public get token(): Token<undefined> {
    return this.operator;
  }
}