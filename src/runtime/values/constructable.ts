import type { ValueType } from "../../code-analysis/type-checker";
import type { Range } from "./range";
import { generateAddress } from "../../utility";
import type Intrinsic from "./intrinsic";
import PValue from "./value";

export const enum ConstructableType {
  Class,
  IntrinsicClass
}

export abstract class Constructable<A extends ValueType[] = ValueType[], R extends ValueType = ValueType> extends PValue {
  public abstract readonly name: string;
  public abstract readonly type: ConstructableType;
  public abstract get constructorArity(): number | Range;
  public abstract construct(...args: A): R;
  public readonly address = generateAddress();

  public isIntrinsic(): this is Intrinsic.Class {
    return this.type === ConstructableType.IntrinsicClass;
  }
}