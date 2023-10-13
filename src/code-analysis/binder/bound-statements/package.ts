import { BoundExpression, BoundStatement } from "../bound-node";
import type { Token } from "../../tokenization/token";
import type Syntax from "../../tokenization/syntax-type";
import AST from "../../parser/ast";

export default class BoundPackageStatement extends BoundStatement {
  public constructor(
    public readonly token: Token<undefined, Syntax.Package>,
    public readonly name: Token<undefined, Syntax.Identifier>
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundStatement<R>): R {
    return visitor.visitPackageStatement(this);
  }
}