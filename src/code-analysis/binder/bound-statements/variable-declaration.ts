import { BoundExpression, BoundStatement } from "../bound-node";
import type { Token } from "../../tokenization/token";
import type VariableSymbol from "../variable-symbol";
import AST from "../../parser/ast";

export default class BoundVariableDeclarationStatement extends BoundStatement {
  public override readonly type = this.symbol.type;

  public constructor(
    public readonly symbol: VariableSymbol,
    public readonly mutable: boolean,
    public readonly initializer?: BoundExpression,
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundStatement<R>): R {
    return visitor.visitVariableDeclarationStatement(this);
  }

  public get token(): Token {
    return this.symbol.name;
  }
}