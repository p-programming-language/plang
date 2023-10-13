import type { Token } from "../../../tokenization/token";
import type Syntax from "../../../tokenization/syntax-type";
import AST from "..";

export class PackageStatement extends AST.Statement {
  public constructor(
    public readonly token: Token<undefined, Syntax.Package>,
    public readonly name: Token<undefined, Syntax.Identifier>
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Statement<R>): R {
    return visitor.visitPackageStatement(this);
  }
}