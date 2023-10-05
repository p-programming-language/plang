import { Token } from "../../../syntax/token";
import AST from "..";

export class PrintlnStatement extends AST.Statement {
  public constructor(
    public readonly token: Token<undefined>,
    public readonly expressions: AST.Expression[]
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Statement<R>): R {
    return visitor.visitPrintlnStatement(this);
  }
}