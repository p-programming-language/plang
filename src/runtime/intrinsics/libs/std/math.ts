import toCamelCase from "to-camel-case";

import type { ValueType } from "../../../../code-analysis/type-checker";
import type { Type } from "../../../../code-analysis/type-checker/types/type";
import SingularType from "../../../../code-analysis/type-checker/types/singular-type";
import Intrinsic from "../../../values/intrinsic";

export default class MathLib extends Intrinsic.Lib {
  public get propertyTypes(): Record<string, Type> {
    return {
      pi: new SingularType("float"),
      e: new SingularType("float")
    };
  }

  public get members(): Record<string, ValueType> {
    const libName = this.name;
    return {
      pi: Math.PI,
      e: Math.E,
      inf: Infinity,

      random: class Random extends Intrinsic.Function {
        public readonly name = `${libName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = new SingularType("float");
        public readonly argumentTypes = {};

        public call(): number {
          return Math.random();
        }
      }
    };
  }
}