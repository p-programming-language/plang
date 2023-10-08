import type { Token } from "../../tokenization/token";
import { BoundStatement } from "../bound-node";
import type AST from "../../parser/ast";

interface ImportLocation {
  readonly intrinsic: boolean;
  readonly path: string;
}

export default class BoundUseStatement extends BoundStatement {
  public constructor(
    public readonly keyword: Token<undefined>,
    public readonly members: Token<undefined>[] | true,
    public readonly location: ImportLocation
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundStatement<R>): R {
    return visitor.visitUseStatement(this);
  }

  public get token(): Token<undefined> {
    return this.keyword;
  }
}