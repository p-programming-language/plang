import util from "util";

import type { Token } from "../tokenization/token";
import type { Type } from "../type-checker/types/type";

export default class VariableSymbol<T extends Type = Type> {
  public constructor(
    public readonly name: Token<undefined>,
    public readonly type: T
  ) {}

  public [util.inspect.custom](): string {
    return this.toString();
  }

  public toString(colors?: boolean): string {
    return `${this.type.toString(colors)} ${this.name.lexeme}`;
  }
}