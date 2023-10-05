import type { Token } from "../../syntax/token";
import type { Type } from "../types/type";

export default class VariableSymbol<T extends Type = Type> {
  public constructor(
    public readonly name: Token,
    public readonly type: T
  ) {}
}