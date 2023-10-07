import type { ValueType } from "../../../code-analysis/type-checker";
import type { Range } from "../../values/range";
import Intrinsic from "../../values/intrinsic";

export default class RangeExtension extends Intrinsic.ValueExtension<Range> {
  public get members(): Record<string, ValueType> {
    const value = this.value;
    return {
      minimum: value.minimum,
      maximum: value.maximum
    };
  }
}