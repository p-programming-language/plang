import { BoundExpression } from "../bound-node";
import type { ValueType } from "../../../type-checker";
import type { Type } from "../../types/type";

export default class BoundLiteralExpression<T extends ValueType = ValueType> extends BoundExpression {
  public constructor(
    public readonly value: T,
    public readonly type: Type
  ) { super(); }
}