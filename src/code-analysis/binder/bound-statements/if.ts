import { BoundExpression, BoundStatement } from "../bound-node";
import type { Token } from "../../tokenization/token";
import AST from "../../parser/ast";

export default class BoundIfStatement extends BoundStatement {
  public constructor(
    public readonly token: Token,
    public readonly condition: BoundExpression,
    public readonly body: BoundStatement,
    public readonly elseBranch?: BoundStatement
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundStatement<R>): R {
    return visitor.visitIfStatement(this);
  }
}