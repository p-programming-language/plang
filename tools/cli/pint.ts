#!/usr/bin/env node
import { command, positional, flag, optional, restPositionals, string, run } from "cmd-ts"
import P from "../p";
import pkg = require("../../package.json");
import { PError } from "../../src/errors";

const pint = command({
  name: "pint",
  version: "v" + pkg.version,
  args: {
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
    filePath: positional({
      type: optional(string),
      displayName: "file path",
      description: "Path to the file to execute P on"
    }),
    args: restPositionals({
      type: string,
      displayName: "args",
      description: "The arguments to pass onto P"
    })
  },
  handler({ tokens, ast, boundAST, results, trace, filePath, args }): void {
    const p = new P(filePath ?? "repl");
    p.executionOptions.outputTokens = tokens;
    p.executionOptions.outputAST = ast;
    p.executionOptions.outputBoundAST = boundAST;
    p.executionOptions.outputResult = results;
    PError.showTrace = trace;

    if (!filePath || !filePath.endsWith(".p") || !filePath.includes("/"))
      return p.repl.start(filePath ? [filePath].concat(...args) : args);

    p.doFile(filePath, args);
  }
})

export const runPint = (argsOverride?: string[]) => run(pint, argsOverride ?? process.argv.slice(2));