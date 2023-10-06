import util from "util";

import { ValueType } from "../type-checker";
import Syntax from "./syntax-type";

const TAB = " ".repeat(2);
const INSPECT_OPTIONS: util.InspectOptions = {
  colors: true,
  compact: false
};

export class Location {
  public constructor(
    public readonly line: number,
    public readonly column: number
  ) {}

  public inspect(): string {
    return this.toString();
  }

  public toString(): string {
    return `(${util.inspect(this.line, INSPECT_OPTIONS)}:${util.inspect(this.column, INSPECT_OPTIONS)})`;
  }
}

export class LocationSpan {
  public constructor(
    public readonly start: Location,
    public readonly finish: Location
  ) {}

  public inspect(): string {
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
    public readonly syntax: S,
    public readonly lexeme: L,
    public readonly value: V,
    public readonly locationSpan: LocationSpan
  ) {}

  public inspect(): string {
    return this.toString();
  }

  public toString(): string {
    return [
      "Token {",
      `${TAB}syntax: ${Syntax[this.syntax]}`,
      `${TAB}lexeme: ${util.inspect(this.lexeme, INSPECT_OPTIONS)}`,
      `${TAB}value: ${util.inspect(this.value, INSPECT_OPTIONS)}`,
      `${TAB}locationSpan: ${this.locationSpan.toString()}`,
      "}"
    ].join("\n");
  }
}
