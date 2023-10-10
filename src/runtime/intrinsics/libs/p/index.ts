import type { ValueType } from "../../../../code-analysis/type-checker";
import type { Type } from "../../../../code-analysis/type-checker/types/type";
import SingularType from "../../../../code-analysis/type-checker/types/singular-type";
import Intrinsic from "../../../values/intrinsic";

import Eval from "./eval";
import SetRecursionDepth from "./set-recursion-depth";

export default class PLib extends Intrinsic.Lib {
  public get propertyTypes(): Record<string, Type> {
    return {
      version: new SingularType("int")
    };
  }

  public get members(): Record<string, ValueType> {
    return {
      version: this.intrinsics.interpreter.runner.version,
      eval: Eval,
      setRecursionDepth: SetRecursionDepth
    };
  }
}