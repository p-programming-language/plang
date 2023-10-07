import { ValueType } from "../../code-analysis/type-checker";
import type { Range } from "./range";
import type Intrinsic from "./intrinsic";
import PValue from "./value";
import { generateAddress } from "../../utility";

export const enum CallableType {
  Function,
  IntrinsicFunction,
  ClassConstructor
}

export abstract class Callable<A extends ValueType[] = ValueType[], R extends ValueType = ValueType> extends PValue {
  public abstract readonly name: string;
  public abstract readonly type: CallableType;
  public abstract get arity(): number | Range;
  public abstract call(...args: A): R | undefined;
  public readonly address = generateAddress();

  public isIntrinsic(): this is Intrinsic.Function {
    return this.type === CallableType.IntrinsicFunction;
  }
}