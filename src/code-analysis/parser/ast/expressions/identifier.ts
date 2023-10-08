import { Token } from "../../../tokenization/token";
import type Syntax from "../../../tokenization/syntax-type";
import AST from "..";

export class IdentifierExpression extends AST.Expression {
  public constructor(
    public readonly name: Token<undefined, Syntax.Identifier>
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Expression<R>): R {
    return visitor.visitIdentifierExpression(this);
  }

  public get token(): Token {
    return this.name;
  }
}