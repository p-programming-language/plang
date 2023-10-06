import { Callable, CallableType } from "./callable";
import type { ValueType } from "../../code-analysis/type-checker";
import type { Type } from "../../code-analysis/type-checker/types/type";
import { Range } from "../../utility";
import SingularType from "../../code-analysis/type-checker/types/singular-type";
import type Intrinsics from "../intrinsics";

namespace Intrinsic {
  export abstract class Lib {
    public constructor(
      protected readonly intrinsics: Intrinsics
    ) {}

    public abstract inject(): void;
  }

  export abstract class Function<A extends ValueType[] = ValueType[], R extends ValueType = ValueType> extends Callable<A, R> {
    public override readonly type = CallableType.IntrinsicFunction;
    public abstract readonly argumentTypes: Record<string, Type>;
    public abstract readonly returnType: Type;

    public constructor(
      protected readonly intrinsics: Intrinsics
    ) { super(); }

    public abstract call(...args: A): R;

    public get arity(): number | Range {
      const nonNullableArguments = Array.from(Object.values(this.argumentTypes))
        .filter(argumentType => !argumentType.isAssignableTo(new SingularType("undefined")));

      const start = nonNullableArguments.length;
      const finish = Array.from(Object.values(this.argumentTypes)).length;
      return start === finish ? start : new Range(start, finish);
    }

    public toString(): string {
      return `<Intrinsic.Function: ${this.address}>`
    }
  }
}

export default Intrinsic;