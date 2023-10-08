import util from "util";

import { Callable, CallableType } from "./callable";
import type { ValueType } from "../../code-analysis/type-checker";
import type { Type } from "../../code-analysis/type-checker/types/type";
import { Range } from "./range";
import { generateAddress, getTypeFromTypeRef } from "../../utility";

import type Intrinsics from "../intrinsics";
import type Interpreter from "../interpreter";
import SingularType from "../../code-analysis/type-checker/types/singular-type";
import InterfaceType from "../../code-analysis/type-checker/types/interface-type";
import LiteralType from "../../code-analysis/type-checker/types/literal-type";
import PValue from "./value";
import PFunction from "./function";
import FunctionType from "../../code-analysis/type-checker/types/function-type";

namespace Intrinsic {
  export type FunctionCtor = new (interpreter?: Interpreter | undefined) => Intrinsic.Function;
  export type LibCtor = new (intrinsics: Intrinsics) => Intrinsic.Lib;

  abstract class Collection extends PValue {
    public abstract get members(): Record<string, ValueType>;
    public abstract get propertyTypes(): Record<string, Type>;
  }

  export abstract class ValueExtension<V extends ValueType = ValueType> extends Collection {
    public constructor(
      protected readonly value: V
    ) { super(); }
  }

  export abstract class Lib extends Collection {
    public readonly address = generateAddress();

    public constructor(
      protected readonly intrinsics: Intrinsics
    ) { super(); }

    public inject(): void {
      const members = Object.entries(this.members);
      for (const [name, value] of members)
        if (value instanceof Intrinsic.Function.constructor)
          this.intrinsics.defineFunction(name, <FunctionCtor><unknown>value);
        else if (value instanceof Intrinsic.Lib) {
          const libType = getLibType(value);
          const mappedLib = new Map(Object.entries(value.members)
            .map(([ memberName, memberValue ]) => [
              memberName,
              memberValue instanceof Intrinsic.Function.constructor ?
                new (<FunctionCtor>memberValue)()
                : memberValue
            ]));

          this.intrinsics.define(name, Object.fromEntries(mappedLib.entries()), libType);
        } else
          this.intrinsics.define(name, value, this.propertyTypes[name]);
    }

    public [util.inspect.custom](): string {
      return this.toString();
    }

    public toString(): string {
      return `<Intrinsic.Lib: ${this.address}>`
    }
  }

  export abstract class Function<A extends ValueType[] = ValueType[], R extends ValueType = ValueType> extends Callable<A, R> {
    public override readonly type = CallableType.IntrinsicFunction;
    public abstract readonly name: string
    public abstract readonly returnType: Type;
    public abstract readonly argumentTypes: Record<string, Type>;

    public constructor(
      protected readonly interpreter?: Interpreter
    ) { super(); }

    public abstract call(...args: A): R;

    public get arity(): number | Range {
      const nonNullableArguments = Array.from(Object.values(this.argumentTypes))
        .filter(argumentType => !argumentType.isAssignableTo(new SingularType("undefined")));

      const start = nonNullableArguments.length;
      const finish = Array.from(Object.values(this.argumentTypes)).length;
      return start === finish ? start : new Range(start, finish);
    }

    public [util.inspect.custom](): string {
      return this.toString();
    }

    public toString(): string {
      return `<Intrinsic.Function: ${this.address}>`
    }
  }

  export const getLibType = (lib: Lib): InterfaceType =>
    new InterfaceType(
      new Map(Array.from(Object.entries(lib.members)).map(([propName, propValue]) => {
        let valueType: Type;
        if (propValue instanceof PFunction)
          valueType = new FunctionType(
            new Map<string, Type>(propValue.definition.parameters.map(param => [param.identifier.name.lexeme, getTypeFromTypeRef(param.typeRef)])),
            getTypeFromTypeRef(propValue.definition.returnType)
          );
        else if (propValue instanceof Intrinsic.Function) {
          valueType = new FunctionType(
            new Map(Object.entries(propValue.argumentTypes)),
            propValue.returnType
          );
        } else if (propValue instanceof Intrinsic.Lib)
          valueType = getLibType(propValue);
        else
          valueType = SingularType.fromValue(propValue);

        return [new LiteralType(propName), {
          valueType,
          mutable: false
        }]
      })),
      new Map,
      lib.constructor.name
    );
}

export default Intrinsic;