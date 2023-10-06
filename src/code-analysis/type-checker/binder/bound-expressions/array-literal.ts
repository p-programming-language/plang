import { BoundExpression } from "../bound-node";
import type { Token } from "../../../tokenization/token";
import ArrayType from "../../types/array-type";
import AST from "../../../parser/ast";

export default class BoundArrayLiteralExpression extends BoundExpression {
  public constructor(
    public readonly token: Token<undefined>,
    public readonly elements: BoundExpression[],
    public readonly type: ArrayType
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundExpression<R>): R {
    return visitor.visitArrayLiteralExpression(this);
  }
}