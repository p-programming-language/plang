import type { ValueType } from "../../../code-analysis/type-checker";
import type { Type } from "../../../code-analysis/type-checker/types/type";
import { Range } from "../../values/range";
import type Intrinsic from "../../values/intrinsic";
import StringExtension from "./string";
import RangeExtension from "./range";
import ArrayExtension from "./array";

namespace IntrinsicExtension {
  export function get(value: ValueType, ...typeParams: Type[]): Intrinsic.ValueExtension {
    let extension;
    switch(typeof value) {
      case "string": {
        extension = new StringExtension(value);
        break;
      }
      default: {
        if (value instanceof Range)
          extension = new RangeExtension(value);
        else if (value instanceof Array)
          extension = new ArrayExtension(value, typeParams[0]);

        break;
      }
    }

    return <Intrinsic.ValueExtension>extension;
  }

  export function getFake(type: string, ...typeParams: Type[]): Intrinsic.ValueExtension {
    let extension;
    switch(type) {
      case "string": {
        extension = new StringExtension("");
        break;
      }
      case "Range": {
        extension = new RangeExtension(new Range(0, 0));
        break;
      }
      case "Array": {
        extension = new ArrayExtension([], typeParams[0]);
        break;
      }
    }

    return <Intrinsic.ValueExtension>extension;
  }
}

export default IntrinsicExtension;