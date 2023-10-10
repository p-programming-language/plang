import { BoundStatement } from "../bound-node";
import type { Token } from "../../tokenization/token";
import type AST from "../../parser/ast";
import { BoundClassMember } from "../../parser/ast/classifications/class-member";

export default class BoundClassBodyStatement extends BoundStatement {
  public constructor(
    public readonly token: Token,
    public readonly members: BoundClassMember[]
  ) { super(); }

  public override accept<R>(visitor: AST.Visitor.BoundStatement<R>): R {
    return visitor.visitClassBodyStatement(this);
  }
}