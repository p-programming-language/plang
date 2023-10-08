import type { Token } from "../../../tokenization/token";
import AST from "..";

interface ImportLocation {
  readonly intrinsic: boolean;
  readonly path: string;
}

export class UseStatement extends AST.Statement {
  public constructor(
    public readonly keyword: Token<undefined>,
    public readonly members: Token<undefined>[] | true,
    public readonly location: ImportLocation
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Statement<R>): R {
    return visitor.visitUseStatement(this);
  }

  public get token(): Token<undefined> {
    return this.keyword;
  }
}