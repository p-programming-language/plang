import { BoundStatement } from "../bound-node";
import type { Token } from "../../../syntax/token";
import AST from "../../../parser/ast";

export default class BoundBlockStatement extends BoundStatement {
  public constructor(
    public readonly token: Token,
    public readonly statements: BoundStatement[]
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundStatement<R>): R {
    return visitor.visitBlockStatement(this);
  }
}