import type { ValueType } from "../../../code-analysis/type-checker";
import type { Range } from "../../values/range";
import Intrinsic from "../../values/intrinsic";
import { Type } from "../../../code-analysis/type-checker/types/type";

export default class RangeExtension extends Intrinsic.ValueExtension<Range> {
  public get propertyTypes(): Record<string, Type> {
    return {};
  }

  public get members(): Record<string, ValueType> {
    const value = this.value;
    return {
      minimum: value.minimum,
      maximum: value.maximum
    };
  }
}