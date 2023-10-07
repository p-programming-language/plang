import { platform } from "os";
import { spawnSync } from "child_process";

import { LocationSpan, Location, Token } from "./code-analysis/tokenization/token";
import { ValueType } from "./code-analysis/type-checker";
import type Intrinsic from "./runtime/values/intrinsic";
import type Syntax from "./code-analysis/tokenization/syntax-type";
import StringExtension from "./runtime/intrinsics/literal-extensions/string";

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

export function getIntrinsicExtension<V extends ValueType = ValueType>(value: V): Intrinsic.ValueExtension<V> {
  let extension;
  switch(typeof value) {
    case "string": {
      extension = new StringExtension(value);
      break;
    }
  }

  return <Intrinsic.ValueExtension<V>>extension;
}

export function getFakeIntrinsicExtension<V extends ValueType = ValueType>(type: string): Intrinsic.ValueExtension<V> {
  let extension;
  switch(type) {
    case "string": {
      extension = new StringExtension("");
      break;
    }
  }

  return <Intrinsic.ValueExtension<V>>extension;
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