import { Token } from "../../../syntax/token";
import AST from "..";

export class ExpressionStatement extends AST.Statement {
  public constructor(
    public readonly expression: AST.Expression
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Statement<R>): R {
    return visitor.visitExpressionStatement(this);
  }

  public get token(): Token {
    return this.expression.token;
  }
}