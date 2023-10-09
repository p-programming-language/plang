import type { Token } from "../../../tokenization/token";
import AST from "..";

export class UnaryExpression extends AST.Expression {
  public constructor(
    public readonly operator: Token<undefined>,
    public readonly operand: AST.Expression
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Expression<R>): R {
    return visitor.visitUnaryExpression(this);
  }

  public get token(): Token {
    return this.operator;
  }
}