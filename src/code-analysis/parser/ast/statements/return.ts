import type { Token } from "../../../tokenization/token";
import type Syntax from "../../../tokenization/syntax-type";
import AST from "..";

export class ReturnStatement extends AST.Statement {
  public constructor(
    public readonly token: Token<undefined, Syntax.Return>,
    public readonly expression: AST.Expression
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Statement<R>): R {
    return visitor.visitReturnStatement(this);
  }
}