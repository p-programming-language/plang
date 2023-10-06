import { readFileSync } from "fs";
import util from "util";
import "colors.ts";

import { TypeChecker, ValueType } from "../src/code-analysis/type-checker";
import Parser from "../src/code-analysis/parser";
import Binder from "../src/code-analysis/type-checker/binder";
import Resolver from "../src/code-analysis/resolver";
import Interpreter from "../src/runtime/interpreter";
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
  private binder = new Binder;
  private resolver = new Resolver;

  public typeChecker = new TypeChecker;
  public interpreter: Interpreter;
  public readonly repl = new REPL(this);
  public readonly version = "v" + pkg.version;
  public readonly executionOptions: PExecutionOptions = {
    outputTokens: false,
    outputAST: false,
    outputBoundAST: false,
    outputResult: false
  };

  public constructor(fileName?: string) {
    this.interpreter = new Interpreter(this, this.resolver, this.binder, fileName)
  }

  public doString(source: string): ValueType {
    const parser = new Parser(source);
    if (this.executionOptions.outputTokens)
      console.log(parser.input!.toString());

    const ast = parser.parse();
    if (this.executionOptions.outputAST)
      console.log(ast.toString());

    this.resolver.resolve(ast);
    const boundAST = this.binder.bindStatements(ast);
    if (this.executionOptions.outputBoundAST)
      console.log(boundAST.toString());

    this.typeChecker.check(boundAST);
    const result = this.interpreter.evaluate(ast);

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
    this.refreshResources();
    return result;
  }

  public refreshResources(): void {
    this.binder = new Binder;
    this.resolver = new Resolver;
    this.typeChecker = new TypeChecker;
    this.interpreter = new Interpreter(this, this.resolver, this.binder,  this.interpreter.fileName);
  }
}