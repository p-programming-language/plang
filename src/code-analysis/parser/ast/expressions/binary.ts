import { Token } from "../../../syntax/token";
import AST from "..";

export class BinaryExpression extends AST.Expression {
  public constructor(
    public readonly left: AST.Expression,
    public readonly right: AST.Expression,
    public readonly operator: Token
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Expression<R>): R {
    return visitor.visitBinaryExpression(this);
  }

  public get token(): Token {
    return this.operator;
  }
}