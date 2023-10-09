#!/usr/bin/env node
import { command, option, flag, optional, restPositionals, string, run } from "cmd-ts"
import P from "../p";
import pkg = require("../../package.json");
import { PError } from "../../src/errors";

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
    tokens: flag({
      long: "tokens",
      description: "Print tokens output"
    }),
    ast: flag({
      long: "ast",
      description: "Print AST output"
    }),
    boundAST: flag({
      long: "bound-ast",
      description: "Print bound AST output"
    }),
    results: flag({
      long: "results",
      description: "Print evaluation result output"
    }),
    trace: flag({
      long: "trace",
      short: "t",
      description: "Print full PError traces"
    }),
    args: restPositionals({
      type: string,
      displayName: "args",
      description: "The arguments to pass onto P"
    })
  },
  handler({ filePath, args, tokens, ast, boundAST, results, trace }): void {
    const p = new P(filePath ?? "repl");
    if (!filePath || filePath !== "string")
      return p.repl.start(args);

    p.executionOptions.outputTokens = tokens;
    p.executionOptions.outputAST = ast;
    p.executionOptions.outputBoundAST = boundAST;
    p.executionOptions.outputResult = results;
    PError.showTrace = trace;
    p.doFile(filePath, args);
  }
})

export const runPint = (argsOverride?: string[]) => run(pint, argsOverride ?? process.argv.slice(2));