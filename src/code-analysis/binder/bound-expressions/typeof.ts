import type { Token } from "../../tokenization/token";
import { BoundExpression } from "../bound-node";
import { INTRINSIC_TYPES } from "../../type-checker/types/type-sets";
import type AST from "../../parser/ast";
import UnionType from "../../type-checker/types/union-type";
import LiteralType from "../../type-checker/types/literal-type";

export default class BoundTypeOfExpression extends BoundExpression {
  public type = new UnionType(
    Array.from(INTRINSIC_TYPES.values())
      .map(typeName => new LiteralType<string>(typeName))
  );

  public constructor(
    public readonly keyword: Token<undefined>,
    public readonly value: BoundExpression
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundExpression<R>): R {
    return visitor.visitTypeOfExpression(this);
  }

  public get token(): Token<undefined> {
    return this.keyword;
  }
}