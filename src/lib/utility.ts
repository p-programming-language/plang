import * as readline from "readline";
import { platform } from "os";
import { spawnSync } from "child_process";

import { LocationSpan, Location, Token } from "../code-analysis/syntax/token";
import { ValueType } from "../code-analysis/type-checker";
import Syntax from "../code-analysis/syntax/syntax-type";

export function readln(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise<string>((resolve) => {
    rl.question(prompt, (input) => {
      rl.close();
      resolve(input);
    });
  });
}

export function clearTerminal(): void {
  const os = platform();

  if (os === "win32")
    spawnSync("cmd", ["/c", "cls"], { stdio: "inherit" });
  else
    spawnSync("clear", [], { stdio: "inherit" });
}

export function fakeToken<V extends ValueType = ValueType>(syntax: Syntax, lexeme: string, value?: V): Token<V> {
  const pseudoLocation = new LocationSpan(new Location(-1, -1), new Location(-1, -1));
  return new Token(syntax, lexeme, <V>value, pseudoLocation);
}

export class Range {
  public constructor(
    public readonly minimum: number,
    public readonly maximum: number
  ) {}
}