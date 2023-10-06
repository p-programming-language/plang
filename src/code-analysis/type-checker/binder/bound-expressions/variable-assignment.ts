import { BoundExpression } from "../bound-node";
import type { Token } from "../../../tokenization/token";
import type VariableSymbol from "../variable-symbol";
import AST from "../../../parser/ast";

export default class BoundVariableAssignmentExpression extends BoundExpression {
  public override readonly type = this.value.type;

  public constructor(
    public readonly symbol: VariableSymbol,
    public readonly value: BoundExpression
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundExpression<R>): R {
    return visitor.visitVariableAssignmentExpression(this);
  }

  public get token(): Token {
    return this.symbol.name;
  }
}