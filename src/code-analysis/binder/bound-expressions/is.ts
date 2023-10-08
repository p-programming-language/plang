import type { Token } from "../../tokenization/token";
import type { Type } from "../../type-checker/types/type";
import { BoundExpression } from "../bound-node";
import type AST from "../../parser/ast";
import SingularType from "../../type-checker/types/singular-type";

export default class BoundIsExpression extends BoundExpression {
  public override readonly type = new SingularType("bool");

  public constructor(
    public readonly value: BoundExpression,
    public readonly typeToCheck: Type,
    public readonly operator: Token<undefined>
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundExpression<R>): R {
    return visitor.visitIsExpression(this);
  }

  public get token(): Token<undefined> {
    return this.operator;
  }
}