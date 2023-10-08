import type { Token } from "../../../tokenization/token";
import AST from "..";

export class WhileStatement extends AST.Statement {
  public constructor(
    public readonly token: Token<undefined>,
    public readonly condition: AST.Expression,
    public readonly body: AST.Statement
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Statement<R>): R {
    return visitor.visitWhileStatement(this);
  }
}