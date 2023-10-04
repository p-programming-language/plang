import { Token } from "../../../syntax/token";
import { BlockStatement } from "./block";
import AST from "..";

export class IfStatement extends AST.Statement {
  public constructor(
    public readonly token: Token,
    public readonly condition: AST.Expression,
    public readonly body: AST.Statement,
    public readonly elseBranch?: AST.Statement
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Statement<R>): R {
    return visitor.visitIfStatement(this);
  }
}