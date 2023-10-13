import toCamelCase from "to-camel-case";

import type { ValueType } from "../../../../code-analysis/type-checker";
import type { Type } from "../../../../code-analysis/type-checker/types/type";
import SingularType from "../../../../code-analysis/type-checker/types/singular-type";
import Intrinsic from "../../../values/intrinsic";
import UnionType from "../../../../code-analysis/type-checker/types/union-type";

export default class TimeLib extends Intrinsic.Lib {
  public get propertyTypes(): Record<string, Type> {
    return {};
  }

  public get members(): Record<string, ValueType> {
    const libName = this.name;
    return {
      // Time since Unix epoch in seconds
      now: class Now extends Intrinsic.Function {
        public readonly name = `${libName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = new SingularType("int");
        public readonly argumentTypes = {};

        public call(): number {
          return Date.now() / 1000;
        }
      },
      wait: class Wait extends Intrinsic.Function {
        public readonly name = `${libName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = new SingularType("void");
        public readonly argumentTypes = {
          seconds: new UnionType([
            new SingularType("int"),
            new SingularType("float")
          ])
        };

        public call(seconds: number): void {
          const start = Date.now() / 1000;
          const expire = start + seconds;
          while (Date.now() / 1000 < expire);
        }
      },
    };
  }
}