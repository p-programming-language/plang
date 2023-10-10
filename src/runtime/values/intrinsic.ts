import toCamelCase from "to-camel-case";
import util from "util";

import { Callable, CallableType } from "./callable";
import type { ClassMemberSignature, ObjectType, ValueType } from "../../code-analysis/type-checker";
import type { Type } from "../../code-analysis/type-checker/types/type";
import { Constructable, ConstructableType } from "./constructable";
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
import ClassType from "../../code-analysis/type-checker/types/class-type";

namespace Intrinsic {
  export type ClassCtor = new (intrinsics: Intrinsics, parentName?: string) => Intrinsic.Class;
  export type FunctionCtor = new (interpreter?: Interpreter | undefined) => Intrinsic.Function;
  export type LibCtor = new (intrinsics: Intrinsics, parentName?: string) => Intrinsic.Lib;

  abstract class Collection extends PValue {
    public abstract get members(): Record<string, ValueType>;
    public abstract get propertyTypes(): Record<string, Type>;
  }

  export abstract class Class<A extends ValueType[] = ValueType[]> extends Constructable<A, ObjectType> {
    public override readonly type = ConstructableType.IntrinsicClass;
    public abstract readonly name: string;
    public abstract readonly constructorArgumentTypes: Record<string, Type>;
    public abstract readonly memberSignatures: Record<string, ClassMemberSignature<Type>>;
    public readonly superclass?: Intrinsic.Class;
    public readonly mixins?: Intrinsic.Class[];
    public readonly address = generateAddress();

    public constructor(
      protected readonly intrinsics: Intrinsics,
      protected readonly parentName?: string
    ) { super(); }

    public get typeSignature(): ClassType {
      const members = new Map(Object.entries(this.memberSignatures)
        .map<[LiteralType<string>, ClassMemberSignature<Type>]>(([name, sig]) => [new LiteralType(name), sig]));

      members.set(new LiteralType("construct"), {
        modifiers: [],
        valueType: new FunctionType(new Map(Object.entries(this.constructorArgumentTypes)), new InterfaceType(
          new Map(
            Array.from(members.entries())
              .filter(([_, sig]) => sig.modifiers.length === 0) // all public instance-level signatures (not private, non protected, not static)
              .map(([name, sig]) => [name, {
                valueType: sig.valueType,
                mutable: sig.mutable
              }])
          ),
          new Map
        )),
        mutable: false
      });

      return new ClassType(
        this.name.split(".").at(-1)!,
        members,
        (this.mixins ?? []).map(mixin => mixin.typeSignature),
        this.superclass?.typeSignature
      );
    }

    public [util.inspect.custom](): string {
      return this.toString();
    }

    public toString(): string {
      return `<Intrinsic.Class: ${this.address}>`
    }

    public get constructorArity(): number | Range {
      const nonNullableArguments = Array.from(Object.values(this.constructorArgumentTypes))
        .filter(argumentType => !argumentType.isAssignableTo(new SingularType("undefined")));

      const start = nonNullableArguments.length;
      const finish = Array.from(Object.values(this.constructorArgumentTypes)).length;
      return start === finish ? start : new Range(start, finish);
    }
  }

  export abstract class ValueExtension<V extends ValueType = ValueType> extends Collection {
    public constructor(
      protected readonly value: V
    ) { super(); }
  }

  export abstract class Lib extends Collection {
    public readonly name = `${this.parentName}.${toCamelCase(this.constructor.name.replace(/Lib/g, ""))}`;
    public readonly address = generateAddress();

    public constructor(
      protected readonly intrinsics: Intrinsics,
      protected readonly parentName?: string
    ) {
      super();
      if (!("interpreter" in intrinsics))
        throw new Error("you fucked up lol");
    }

    public inject(): void {
      const members = Object.entries(this.members);
      for (const [name, value] of members)
        if (value instanceof Intrinsic.Function.constructor)
          this.intrinsics.defineFunction(name, <FunctionCtor><unknown>value);
        else if (value instanceof Intrinsic.Function)
          this.intrinsics.defineFunctionFromInstance(name, value);
        else if (value instanceof Intrinsic.Lib.constructor)
          this.intrinsics.defineLib(name, <LibCtor><unknown>value);
        else if (value instanceof Intrinsic.Lib)
          this.intrinsics.defineLibFromInstance(name, value);
        else
          this.intrinsics.define(name, value, this.propertyTypes[name]);
    }

    public get typeSignature(): InterfaceType {
      const typeTracker = this.intrinsics.interpreter.runner.host.typeTracker;
      return new InterfaceType(
        new Map(Array.from(Object.entries(this.members)).map(([propName, propValue]) => {
          let valueType: Type;
          if (propValue instanceof PFunction)
            valueType = new FunctionType(
              new Map<string, Type>(propValue.definition.parameters.map(param =>
                [param.identifier.name.lexeme, getTypeFromTypeRef(typeTracker, param.typeRef)]
              )),
              getTypeFromTypeRef(typeTracker, propValue.definition.returnType)
            );
          else if (propValue instanceof Intrinsic.Function || propValue instanceof Intrinsic.Class || propValue instanceof Intrinsic.Lib)
            valueType = propValue.typeSignature;
          else if (propValue instanceof Intrinsic.Function.constructor)
            valueType = new (<Intrinsic.FunctionCtor>propValue)(this.intrinsics.interpreter).typeSignature;
          else if (propValue instanceof Intrinsic.Class.constructor || propValue instanceof Intrinsic.Lib.constructor)
            valueType = new (<Intrinsic.ClassCtor | Intrinsic.LibCtor>propValue)(this.intrinsics).typeSignature;
          else
            valueType = SingularType.fromValue(propValue);

          return [new LiteralType(propName), {
            valueType,
            mutable: false
          }]
        })),
        new Map,
        this.constructor.name
      );
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
    public abstract readonly name: string;
    public abstract readonly returnType: Type;
    public abstract readonly argumentTypes: Record<string, Type>;

    public constructor(
      protected readonly interpreter?: Interpreter
    ) { super(); }

    public get typeSignature(): FunctionType {
      return new FunctionType(new Map<string, Type>(Object.entries(this.argumentTypes)), this.returnType)
    }

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
      return `<Intrinsic.Function: ${this.address}>`;
    }
  }
}

export default Intrinsic;