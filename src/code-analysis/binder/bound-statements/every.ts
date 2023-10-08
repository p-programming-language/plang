import { type BoundExpression, BoundStatement } from "../bound-node";
import type { Token } from "../../tokenization/token";
import type BoundVariableDeclarationStatement from "./variable-declaration";
import type AST from "../../parser/ast";

export default class BoundEveryStatement extends BoundStatement {
  public constructor(
    public readonly token: Token,
    public readonly elementDeclarations: BoundVariableDeclarationStatement[],
    public readonly iterable: BoundExpression,
    public readonly body: BoundStatement
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundStatement<R>): R {
    return visitor.visitEveryStatement(this);
  }
}