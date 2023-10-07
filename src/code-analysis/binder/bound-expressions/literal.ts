import { BoundExpression } from "../bound-node";
import type { Token } from "../../tokenization/token";
import type { ValueType } from "../../type-checker";
import type { Type } from "../../type-checker/types/type";
import type Syntax from "../../tokenization/syntax-type";
import AST from "../../parser/ast";

export default class BoundLiteralExpression<V extends ValueType = ValueType, S extends Syntax = Syntax> extends BoundExpression {
  public constructor(
    public readonly token: Token<V, S>,
    public readonly type: Type
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundExpression<R>): R {
    return visitor.visitLiteralExpression(this);
  }
}