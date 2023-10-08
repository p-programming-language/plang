import type { Token } from "../../../tokenization/token";
import type { VariableDeclarationStatement } from "./variable-declaration";
import AST from "..";

export class EveryStatement extends AST.Statement {
  public constructor(
    public readonly token: Token<undefined>,
    public readonly elementDeclarations: VariableDeclarationStatement[],
    public readonly iterable: AST.Expression,
    public readonly body: AST.Statement
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Statement<R>): R {
    return visitor.visitEveryStatement(this);
  }
}