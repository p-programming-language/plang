import type { ValueType } from "../../../../code-analysis/type-checker";
import type { Type } from "../../../../code-analysis/type-checker/types/type";
import Intrinsic from "../../../values/intrinsic";

import IOLib from "./io";
import SystemLib from "./system";
import MathLib from "./math";
import ColorLib from "./colors"
import TimeLib from "./time";

export default class StdLib extends Intrinsic.Lib {
  public get propertyTypes(): Record<string, Type> {
    return {};
  }

  public get members(): Record<string, ValueType> {
    return {
      io: IOLib,
      system: SystemLib,
      math: MathLib,
      colors: ColorLib,
      time: TimeLib
    };
  }
}