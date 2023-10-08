import { BoundStatement } from "../bound-node";
import type { Token } from "../../tokenization/token";
import AST from "../../parser/ast";

export default class BoundBreakStatement extends BoundStatement {
  public constructor(
    public readonly token: Token<undefined>
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundStatement<R>): R {
    return visitor.visitBreakStatement(this);
  }
}