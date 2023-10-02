import { Token } from "../../../syntax/token";
import { IdentifierExpression } from "./identifier";
import AST from "..";

export class VariableDeclarationExpression extends AST.Expression {
  public constructor(
    public readonly typeKeyword: Token,
    public readonly identifier: IdentifierExpression,
    public readonly initializer?: AST.Expression
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Expression<R>): R {
    return visitor.visitVariableDeclarationExpression(this);
  }

  public get token(): Token {
    return this.typeKeyword;
  }
}