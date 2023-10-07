import type { ValueType } from "../../../../../code-analysis/type-checker";
import type { Type } from "../../../../../code-analysis/type-checker/types/type";
import Intrinsic from "../../../../values/intrinsic";
import Readln from "./readln";

export default class IOLib extends Intrinsic.Lib {
  public get propertyTypes(): Record<string, Type> {
    return {};
  }

  public get members(): Record<string, ValueType> {
    return {
      readln: Readln
    };
  }
}