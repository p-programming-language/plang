import { platform } from "os";
import { spawnSync } from "child_process";

import { LocationSpan, Location, Token } from "./code-analysis/tokenization/token";
import { ValueType } from "./code-analysis/type-checker";
import Syntax from "./code-analysis/tokenization/syntax-type";

export function clearTerminal(): void {
  const os = platform();

  if (os === "win32")
    spawnSync("cmd", ["/c", "cls"], { stdio: "inherit" });
  else
    spawnSync("clear", [], { stdio: "inherit" });
}

export function fakeToken<V extends ValueType = ValueType, S extends Syntax = Syntax>(syntax: S, lexeme: string, value?: V): Token<V, S> {
  const pseudoLocation = new LocationSpan(new Location(-1, -1), new Location(-1, -1));
  return new Token<V, S>(syntax, lexeme, <V>value, pseudoLocation);
}

export class Range {
  public constructor(
    public readonly minimum: number,
    public readonly maximum: number
  ) {}

  public isWithin(n: number): boolean {
    return n >= this.minimum && n <= this.maximum;
  }

  public toString(): string {
    return this.minimum + ".." + this.maximum;
  }
}