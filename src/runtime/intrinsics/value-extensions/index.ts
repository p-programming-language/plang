import type { ValueType } from "../../../code-analysis/type-checker";
import { Range } from "../../values/range";
import type Intrinsic from "../../values/intrinsic";
import StringExtension from "./string";
import RangeExtension from "./range";
import ArrayExtension from "./array";

namespace IntrinsicExtension {
  export function get<V extends ValueType = ValueType>(value: V): Intrinsic.ValueExtension<V> {
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
          extension = new ArrayExtension(value);

        break;
      }
    }

    return <Intrinsic.ValueExtension<V>>extension;
  }

  export function getFake<V extends ValueType = ValueType>(type: string): Intrinsic.ValueExtension<V> {
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
        extension = new ArrayExtension([]);
        break;
      }
    }

    return <Intrinsic.ValueExtension<V>>extension;
  }
}

export default IntrinsicExtension;