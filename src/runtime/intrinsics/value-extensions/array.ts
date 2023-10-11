import toCamelCase from "to-camel-case";

import type { ValueType } from "../../../code-analysis/type-checker";
import type { Type } from "../../../code-analysis/type-checker/types/type";
import SingularType from "../../../code-analysis/type-checker/types/singular-type";
import Intrinsic from "../../values/intrinsic";
import ArrayType from "../../../code-analysis/type-checker/types/array-type";

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
    const thisType = new ArrayType(elementType);
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
      append: class Append extends Intrinsic.Function {
        public readonly name = `${extensionName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = thisType;
        public readonly argumentTypes = { element: elementType };

        public call(element: any): T[] {
          value.push(element);
          return value;
        }
      },
      prepend: class Prepend extends Intrinsic.Function {
        public readonly name = `${extensionName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = thisType;
        public readonly argumentTypes = { element: elementType };

        public call(element: any): T[] {
          value.unshift(element);
          return value;
        }
      },
      combine: class Combine extends Intrinsic.Function {
        public readonly name = `${extensionName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = thisType;
        public readonly argumentTypes = { other: thisType };

        public call(other: any[]): any[] {
          return value.concat(other);
        }
      }
    };
  }
}