import { ValueType } from "../../code-analysis/type-checker";
import { Range } from "../../utility";
import type Intrinsic from "./intrinsic";

export const enum CallableType {
  Function,
  IntrinsicFunction,
  ClassConstructor
}

export abstract class Callable<A extends ValueType[] = ValueType[], R extends ValueType = ValueType> {
  public abstract readonly type: CallableType;
  public abstract call(...args: A): R | undefined;
  public abstract get arity(): number | Range;
  public address = `0x${Math.random().toString(16).slice(2, 12)}`;

  public isIntrinsic(): this is Intrinsic.Function {
    return this.type === CallableType.IntrinsicFunction;
  }
}