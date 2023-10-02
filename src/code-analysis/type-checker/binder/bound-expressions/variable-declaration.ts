import { BoundExpression } from "../bound-node";
import type VariableSymbol from "../../variable-symbol";

export default class BoundVariableDeclarationExpression extends BoundExpression {
  public override type = this.symbol.type;

  public constructor(
    public readonly symbol: VariableSymbol,
    public readonly initializer?: BoundExpression
  ) { super(); }
}