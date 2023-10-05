import { ValueType } from "../../code-analysis/type-checker";
import { Callable, CallableType } from "./callable";
import type { Type } from "../../code-analysis/type-checker/types/type";
import Interpreter from "../interpreter";

namespace Intrinsic {
  export abstract class Function<A extends ValueType[] = ValueType[], R extends ValueType = ValueType> extends Callable<A, R> {
    public override readonly type = CallableType.IntrinsicFunction;
    public abstract readonly argumentTypes: Record<string, Type>;
    public abstract readonly returnType: Type;

    public constructor(
      protected readonly interpreter: Interpreter
    ) { super(); }

    public abstract call(...args: A): R;

    public toString(): string {
      return `<Intrinsic.Function: ${this.address}>`
    }
  }
}

export default Intrinsic;