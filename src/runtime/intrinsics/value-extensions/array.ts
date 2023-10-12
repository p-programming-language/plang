import toCamelCase from "to-camel-case";

import type { ValueType } from "../../../code-analysis/type-checker";
import type { Type } from "../../../code-analysis/type-checker/types/type";
import SingularType from "../../../code-analysis/type-checker/types/singular-type";
import Intrinsic from "../../values/intrinsic";
import ArrayType from "../../../code-analysis/type-checker/types/array-type";
import { maybe } from "../../../utility";

const extensionName = "Array";
export default class ArrayExtension<T extends ValueType = ValueType> extends Intrinsic.ValueExtension<T[]> {
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
    const { value: array, elementType } = this;
    const thisType = new ArrayType(elementType);
    return {
      length: array.length,

      join: class Join extends Intrinsic.Function {
        public readonly name = `${extensionName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = new SingularType("string");
        public readonly argumentTypes = { separator: new SingularType("string") };

        public call(separator: string): string {
          return array.join(separator);
        }
      },
      append: class Append extends Intrinsic.Function {
        public readonly name = `${extensionName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = thisType;
        public readonly argumentTypes = { element: elementType };

        public call(element: any): T[] {
          array.push(element);
          return array;
        }
      },
      prepend: class Prepend extends Intrinsic.Function {
        public readonly name = `${extensionName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = thisType;
        public readonly argumentTypes = { element: elementType };

        public call(element: any): T[] {
          array.unshift(element);
          return array;
        }
      },
      combine: class Combine extends Intrinsic.Function {
        public readonly name = `${extensionName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = thisType;
        public readonly argumentTypes = { other: thisType };

        public call(other: any[]): any[] {
          return array.concat(other);
        }
      },
      pop: class Pop extends Intrinsic.Function {
        public readonly name = `${extensionName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = maybe(elementType);
        public readonly argumentTypes = {};

        public call(): T | undefined {
          return array.pop();
        }
      },
      remove: class Remove extends Intrinsic.Function {
        public readonly name = `${extensionName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = maybe(elementType);
        public readonly argumentTypes = { index: new SingularType("int") };

        public call(index: number): T | undefined {
          const element = array[index];
          array.splice(index, 1);
          return element;
        }
      },
      removeValue: class RemoveValue extends Intrinsic.Function {
        public readonly name = `${extensionName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = new SingularType("void");
        public readonly argumentTypes = { element: elementType };

        public call(element: T): void {
          const index = array.indexOf(element);
          if (index !== -1)
            array.splice(index, 1);
        }
      },
    };
  }
}