import { BoundStatement } from "../bound-node";
import type { Token } from "../../../tokenization/token";
import type { Type } from "../../types/type";
import type VariableSymbol from "../variable-symbol";
import AST from "../../../parser/ast";

export default class BoundTypeDeclarationStatement<T extends Type = Type> extends BoundStatement {
  public override readonly type = this.symbol.type;

  public constructor(
    public readonly symbol: VariableSymbol<T>
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundStatement<R>): R {
    return visitor.visitTypeDeclarationStatement(this);
  }

  public get token(): Token {
    return this.symbol.name;
  }
}