import { BlockStatement } from "./block";
import type AST from "..";

export class ClassBodyStatement extends BlockStatement {
  public accept<R>(visitor: AST.Visitor.Statement<R>): R {
    return visitor.visitClassBodyStatement(this);
  }
}