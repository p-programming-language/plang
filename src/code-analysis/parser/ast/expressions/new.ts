import type { Token } from "../../../tokenization/token";
import type { IdentifierExpression } from "./identifier";
import type Syntax from "../../../tokenization/syntax-type";
import AST from "..";

export class NewExpression extends AST.Expression {
  public constructor(
    public readonly token: Token<undefined, Syntax.New>,
    public readonly classRef: IdentifierExpression,
    public readonly constructorArgs: AST.Expression[]
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Expression<R>): R {
    return visitor.visitNewExpression(this);
  }
}