import toCamelCase from "to-camel-case";

import type { ValueType } from "../../../../../code-analysis/type-checker";
import type { Type } from "../../../../../code-analysis/type-checker/types/type";
import { maybe } from "../../../../../utility";
import SingularType from "../../../../../code-analysis/type-checker/types/singular-type";
import Intrinsic from "../../../../values/intrinsic";

export default class EnvLib extends Intrinsic.Lib {
  public get propertyTypes(): Record<string, Type> {
    return {};
  }

  public get members(): Record<string, ValueType> {
    const libName = this.name;
    return {
      get: class Get extends Intrinsic.Function {
        public readonly name = `${libName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = maybe(new SingularType("string"));
        public readonly argumentTypes = { name: new SingularType("string") };

        public call(name: string): string | undefined {
          return process.env[name];
        }
      },
      set: class Set extends Intrinsic.Function {
        public readonly name = `${libName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = new SingularType("void");
        public readonly argumentTypes = {
          name: new SingularType("string"),
          value: new SingularType("string")
        };

        public call(name: string, value: string): void {
          process.env[name] = value;
        }
      }
    };
  }
}