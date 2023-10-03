import { BoundExpression, BoundStatement } from "../bound-node";
import type { Token } from "../../../syntax/token";
import type VariableSymbol from "../../variable-symbol";
import AST from "../../../parser/ast";

export default class BoundVariableAssignmentStatement extends BoundStatement {
  public override readonly type = this.value.type;

  public constructor(
    public readonly symbol: VariableSymbol,
    public readonly value: BoundExpression
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundStatement<R>): R {
    return visitor.visitVariableAssignmentStatement(this);
  }

  public get token(): Token {
    return this.symbol.name;
  }
}