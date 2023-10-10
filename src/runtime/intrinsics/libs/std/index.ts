import Intrinsics from "../..";
import type { ValueType } from "../../../../code-analysis/type-checker";
import type { Type } from "../../../../code-analysis/type-checker/types/type";
import Intrinsic from "../../../values/intrinsic";

import IOLib from "./io";
import SystemLib from "./system";

export default class StdLib extends Intrinsic.Lib {
  public get propertyTypes(): Record<string, Type> {
    return {};
  }

  public get members(): Record<string, ValueType> {
    return {
      io: new IOLib(this.intrinsics, this.name),
      system: new SystemLib(this.intrinsics, this.name)
    };
  }
}