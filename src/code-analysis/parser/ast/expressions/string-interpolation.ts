import type { Token } from "../../../syntax/token";
import type { LiteralExpression } from "./literal";
import AST from "..";

export class StringInterpolationExpression extends AST.Expression {
  public constructor(
    public readonly parts: (LiteralExpression<string> | AST.Expression)[]
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Expression<R>): R {
    return visitor.visitStringInterpolationExpression(this);
  }

  public get token(): Token {
    return this.parts[0].token;
  }
}