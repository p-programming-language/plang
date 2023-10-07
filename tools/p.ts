import { readFileSync } from "fs";
import util from "util";
import "colors.ts";

import type { ValueType } from "../src/code-analysis/type-checker";
import PHost from "./classes/p-host";
import Parser from "../src/code-analysis/parser";
import PValue from "../src/runtime/values/value";
import REPL from "./classes/repl";
import pkg = require("../package.json");

interface PExecutionOptions {
  outputTokens: boolean;
  outputAST: boolean;
  outputBoundAST: boolean;
  outputResult: boolean;
}

export default class P {
  public host: PHost;
  public readonly repl = new REPL(this);
  public readonly version = "v" + pkg.version;
  public readonly executionOptions: PExecutionOptions = {
    outputTokens: false,
    outputAST: false,
    outputBoundAST: false,
    outputResult: false
  };

  public constructor(
    private readonly fileName?: string
  ) {
    this.host = new PHost(this, fileName);
  }

  public doString(source: string): ValueType {
    const parser = this.createParser(source);
    if (this.executionOptions.outputTokens)
      console.log(parser.input!.toString());

    const ast = parser.parse();
    if (this.executionOptions.outputAST)
      console.log(ast.toString());

    this.host.resolver.resolve(ast);
    const boundAST = this.host.binder.bindStatements(ast);
    if (this.executionOptions.outputBoundAST)
      console.log(boundAST.toString());

    this.host.typeChecker.check(boundAST);
    const result = this.host.interpreter.evaluate(ast);

    if (this.executionOptions.outputResult) {
      const stringified = result instanceof PValue ?
        result.toString()
        : util.inspect(result, { colors: true });

      console.log("↳".gray(8), stringified);
    }

    return result;
  }

  public doFile(filePath: string): ValueType {
    const fileContents = readFileSync(filePath, "utf-8");
    const result = this.doString(fileContents);
    this.newHost();
    return result;
  }

  public createParser(source: string): Parser {
    return this.host.createParser(source);
  }

  public newHost(): void {
    this.host = new PHost(this, this.fileName);
  }
}