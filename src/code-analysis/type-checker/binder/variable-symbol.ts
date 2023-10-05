import type { Token } from "../../syntax/token";
import type { Type } from "../types/type";

export default class VariableSymbol {
  public constructor(
    public readonly name: Token,
    public readonly type: Type
  ) {}
}