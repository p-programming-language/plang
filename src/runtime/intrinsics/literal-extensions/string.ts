import type { ValueType } from "../../../code-analysis/type-checker";
import SingularType from "../../../code-analysis/type-checker/types/singular-type";
import ArrayType from "../../../code-analysis/type-checker/types/array-type";
import Intrinsic from "../../values/intrinsic";
import UnionType from "../../../code-analysis/type-checker/types/union-type";

export default class StringExtension extends Intrinsic.ValueExtension<string> {
  public get members(): Record<string, ValueType> {
    const value = this.value;
    return {
      length: value.length,

      repeat: new (class Repeat extends Intrinsic.Function {
        public readonly name = "string.repeat";
        public readonly returnType = new SingularType("string");
        public readonly argumentTypes = { times: new SingularType("int") };

        public call(times: number): string {
          return value.repeat(times);
        }
      })(),

      split: new (class Split extends Intrinsic.Function {
        public readonly name = "string.split";
        public readonly returnType = new ArrayType(new SingularType("string"));
        public readonly argumentTypes = {
          separator: new SingularType("string"),
          limit: new UnionType([
            new SingularType("int"),
            new SingularType("undefined")
          ])
        };

        public call(separator: string, limit: number): string[] {
          return value.split(separator, limit);
        }
      })()
    };
  }
}