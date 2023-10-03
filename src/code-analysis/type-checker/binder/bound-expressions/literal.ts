import { BoundExpression } from "../bound-node";
import type { Token } from "../../../syntax/token";
import type { ValueType } from "../../../type-checker";
import type { Type } from "../../types/type";
import AST from "../../../parser/ast";

export default class BoundLiteralExpression<V extends ValueType = ValueType> extends BoundExpression {
  public constructor(
    public readonly token: Token<V>,
    public readonly type: Type
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundExpression<R>): R {
    return visitor.visitLiteralExpression(this);
  }
}