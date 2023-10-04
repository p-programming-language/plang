import { Token } from "../../../syntax/token";
import { IdentifierExpression } from "../expressions/identifier";
import AST from "..";

export class VariableDeclarationStatement extends AST.Statement {
  public constructor(
    public readonly type: AST.TypeNode,
    public readonly identifier: IdentifierExpression,
    public readonly initializer?: AST.Expression
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Statement<R>): R {
    return visitor.visitVariableDeclarationStatement(this);
  }

  public get token(): Token {
    return this.type.token;
  }
}