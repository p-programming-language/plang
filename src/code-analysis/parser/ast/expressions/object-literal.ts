import type { Token } from "../../../syntax/token";
import AST from "..";

export class ObjectLiteralExpression extends AST.Expression {
  public constructor(
    public readonly token: Token<undefined>,
    public readonly properties: Map<AST.Expression, AST.Expression>
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Expression<R>): R {
    return visitor.visitObjectLiteralExpression(this);
  }
}