import toCamelCase from "to-camel-case";

import type { ValueType } from "../../../code-analysis/type-checker";
import type { Type } from "../../../code-analysis/type-checker/types/type";
import SingularType from "../../../code-analysis/type-checker/types/singular-type";
import Intrinsic from "../../values/intrinsic";

const extensionName = "Array";
export default class ArrayExtension<T = any> extends Intrinsic.ValueExtension<T[]> {
  public constructor(
    value: T[],
    private readonly elementType: Type
  ) { super(value); }

  public get propertyTypes(): Record<string, Type> {
    return {
      length: new SingularType("int")
    };
  }

  public get members(): Record<string, ValueType> {
    const { value, elementType } = this;
    return {
      length: value.length,

      join: class Join extends Intrinsic.Function {
        public readonly name = `${extensionName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = new SingularType("string");
        public readonly argumentTypes = { separator: new SingularType("string") };

        public call(separator: string): string {
          return value.join(separator);
        }
      },
      push: class Push extends Intrinsic.Function {
        public readonly name = `${extensionName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = new SingularType("int");
        public readonly argumentTypes = { element: elementType };

        public call(element: any): number {
          return value.push(element);
        }
      }
    };
  }
}