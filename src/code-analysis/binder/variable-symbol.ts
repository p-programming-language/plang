import type { Token } from "../tokenization/token";
import type { Type } from "../type-checker/types/type";

export default class VariableSymbol<T extends Type = Type> {
  public constructor(
    public readonly name: Token,
    public readonly type: T
  ) {}
}