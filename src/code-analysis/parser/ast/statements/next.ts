import type { Token } from "../../../tokenization/token";
import AST from "..";

export class NextStatement extends AST.Statement {
  public constructor(
    public readonly token: Token<undefined>
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Statement<R>): R {
    return visitor.visitNextStatement(this);
  }
}