import BoundBlockStatement from "./block";
import type AST from "../../parser/ast";

export default class BoundClassBodyStatement extends BoundBlockStatement {
  public override accept<R>(visitor: AST.Visitor.BoundStatement<R>): R {
    return visitor.visitClassBodyStatement(this);
  }
}