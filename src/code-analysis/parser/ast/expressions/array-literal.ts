import { Token } from "../../../syntax/token";
import AST from "..";

export class ArrayLiteralExpression extends AST.Expression {
  public constructor(
    public readonly token: Token<undefined>,
    public readonly elements: AST.Expression[]
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Expression<R>): R {
    return visitor.visitArrayLiteralExpression(this);
  }
}