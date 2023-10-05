import type { Token } from "../../../syntax/token";
import AST from "..";

export class CallExpression extends AST.Expression {
  public constructor(
    public readonly callee: AST.Expression,
    public readonly args: AST.Expression[]
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Expression<R>): R {
    return visitor.visitCallExpression(this);
  }

  public get token(): Token {
    return this.callee.token;
  }
}