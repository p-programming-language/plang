#!/usr/bin/env node
import { command, option, optional, restPositionals, string, run } from "cmd-ts"
import P from "../p";
import pkg = require("../../package.json");

const pint = command({
  name: "pint",
  version: "v" + pkg.version,
  args: {
    filePath: option({
      type: optional(string),
      long: "file",
      short: "f",
      description: "Path to the file to execute P on"
    }),
    args: restPositionals({
      type: string,
      displayName: "args",
      description: "The arguments to pass onto P"
    })
  },
  handler({ filePath, args }): void {
    const p = new P(filePath ?? "repl");
    if (!filePath || filePath !== "string")
      return p.repl.start(args);

    p.executionOptions.outputAST = false;
    p.executionOptions.outputBoundAST = false;
    p.executionOptions.outputResult = false;
    p.doFile(filePath, args);
  }
})

export const runPint = (argsOverride?: string[]) => run(pint, argsOverride ?? process.argv.slice(2));