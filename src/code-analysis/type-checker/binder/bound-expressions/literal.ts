import { ValueType } from "../../../type-checker";
import { BoundExpression } from "..";
import Type from "../../types/type";

export class BoundLiteralExpression<T extends ValueType = ValueType> extends BoundExpression {
  public constructor(
    public readonly value: T,
    public readonly type: Type
  ) { super(); }
}