import util from "util";

import { ValueType } from "../type-checker";
import Syntax from "./syntax-type";

const TAB = " ".repeat(2);
util.inspect.defaultOptions = {
  colors: true,
  getters: true
};

export class Location {
  public constructor(
    public readonly line: number,
    public readonly column: number
  ) {}

  public [util.inspect.custom](): string {
    return this.toString();
  }

  public toString(): string {
    return `(${util.inspect(this.line)}:${util.inspect(this.column)})`;
  }
}

export class LocationSpan {
  public constructor(
    public readonly start: Location,
    public readonly finish: Location
  ) {}

  public [util.inspect.custom](): string {
    return this.toString();
  }

  public toString(): string {
    return `${this.start.toString()} - ${this.finish.toString()}`;
  }
}

export class Token<
  V extends ValueType = ValueType,
  S extends Syntax = Syntax,
  L extends string = string
> {

  public constructor(
    public syntax: S,
    public lexeme: L,
    public value: V,
    public readonly locationSpan: LocationSpan
  ) {}

  public [util.inspect.custom](): string {
    return this.toString();
  }

  public toString(): string {
    return [
      "Token {",
      `${TAB}syntax: ${util.inspect(Syntax[this.syntax])}`,
      `${TAB}lexeme: ${util.inspect(this.lexeme)}`,
      `${TAB}value: ${util.inspect(this.value)}`,
      `${TAB}locationSpan: ${this.locationSpan.toString()}`,
      "}"
    ].join("\n");
  }
}
