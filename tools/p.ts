import { readFileSync } from "fs";
import util from "util";

import { TypeChecker, ValueType } from "../src/code-analysis/type-checker";
import Parser from "../src/code-analysis/parser";
import Binder from "../src/code-analysis/type-checker/binder";
import Resolver from "../src/code-analysis/resolver";
import Interpreter from "../src/runtime/interpreter";

interface PExecutionOptions {
  outputAST: boolean;
  outputBoundAST: boolean;
  outputResult: boolean;
}

export default class P {
  private binder = new Binder;
  private resolver = new Resolver;
  private typeChecker = new TypeChecker;
  private interpreter = new Interpreter;

  public executionOptions: PExecutionOptions = {
    outputAST: false,
    outputBoundAST: false,
    outputResult: false
  };

  public doString(source: string): ValueType {
    const parser = new Parser(source);
    const ast = parser.parse();
    if (this.executionOptions.outputAST)
      console.log(ast.toString());

    this.resolver.resolve(ast);
    const boundAST = this.binder.bindStatements(ast);
    if (this.executionOptions.outputBoundAST)
      console.log(boundAST.toString());

    this.typeChecker.check(boundAST);
    const result = this.interpreter.evaluate(ast);

    if (this.executionOptions.outputResult)
      console.log(util.inspect(result, { colors: true, compact: false }));

    return result;
  }

  public doFile(filePath: string): ValueType {
    const fileContents = readFileSync(filePath, "utf-8");
    const result = this.doString(fileContents);
    this.refreshResources();
    return result;
  }

  private refreshResources(): void {
    this.binder = new Binder;
    this.resolver = new Resolver;
    this.typeChecker = new TypeChecker;
    this.interpreter = new Interpreter;
  }
}