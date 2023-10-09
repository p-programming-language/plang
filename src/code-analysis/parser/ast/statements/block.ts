import type { Token } from "../../../tokenization/token";
import AST from "..";

export class BlockStatement extends AST.Statement {
  public constructor(
    public readonly token: Token,
    public readonly statements: AST.Statement[]
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Statement<R>): R {
    return visitor.visitBlockStatement(this);
  }
}