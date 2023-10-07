import type { ValueType } from "../../../code-analysis/type-checker";
import SingularType from "../../../code-analysis/type-checker/types/singular-type";
import Intrinsic from "../../values/intrinsic";

export default class StringExtension extends Intrinsic.ValueExtension<string> {
  public get members(): Record<string, ValueType> {
    const value = this.value;
    return {
      length: value.length,
      repeat: new (class Repeat extends Intrinsic.Function {
        public readonly argumentTypes = { times: new SingularType("int") };
        public readonly returnType = new SingularType("string");

        public call(times: number): string {
          return value.repeat(times);
        }
      })()
    };
  }
}