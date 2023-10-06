import { BoundExpression, BoundStatement } from "../bound-node";
import type { Token } from "../../../tokenization/token";
import AST from "../../../parser/ast";

export default class BoundPrintlnStatement extends BoundStatement {
  public constructor(
    public readonly token: Token<undefined>,
    public readonly expressions: BoundExpression[]
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundStatement<R>): R {
    return visitor.visitPrintlnStatement(this);
  }
}