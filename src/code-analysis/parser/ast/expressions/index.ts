import { Token } from "../../../tokenization/token";
import AST from "..";

export class AccessExpression extends AST.Expression {
  public constructor(
    public readonly token: Token<undefined>,
    public readonly object: AST.Expression,
    public readonly index: AST.Expression
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Expression<R>): R {
    return visitor.visitIndexExpression(this);
  }
}