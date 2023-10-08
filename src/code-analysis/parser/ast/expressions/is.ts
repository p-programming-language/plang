import type { Token } from "../../../tokenization/token";
import AST from "..";

export class IsExpression extends AST.Expression {
  public constructor(
    public readonly value: AST.Expression,
    public readonly typeRef: AST.TypeRef,
    public readonly inversed: boolean,
    public readonly operator: Token<undefined>
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Expression<R>): R {
    return visitor.visitIsExpression(this);
  }

  public get token(): Token<undefined> {
    return this.operator;
  }
}