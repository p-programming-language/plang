import toCamelCase from "to-camel-case";

import type { ValueType } from "../../../code-analysis/type-checker";
import type { Type } from "../../../code-analysis/type-checker/types/type";
import SingularType from "../../../code-analysis/type-checker/types/singular-type";
import ArrayType from "../../../code-analysis/type-checker/types/array-type";
import Intrinsic from "../../values/intrinsic";
import UnionType from "../../../code-analysis/type-checker/types/union-type";

const extensionName = "string";
export default class StringExtension extends Intrinsic.ValueExtension<string> {
  public get propertyTypes(): Record<string, Type> {
    return {
      length: new SingularType("int")
    };
  }

  public get members(): Record<string, ValueType> {
    const value = this.value;
    return {
      length: value.length,

      repeat: class Repeat extends Intrinsic.Function {
        public readonly name = `${extensionName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = new SingularType("string");
        public readonly argumentTypes = { times: new SingularType("int") };

        public call(times: number): string {
          return value.repeat(times);
        }
      },

      split: class Split extends Intrinsic.Function {
        public readonly name = `${extensionName}.${toCamelCase(this.constructor.name)}`;
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
      }
    };
  }
}