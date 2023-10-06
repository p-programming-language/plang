import { readFileSync } from "fs";
import { platform } from "os";
import reader from "readline-sync";
import util from "util";
import "colors.ts";

import { PError } from "../src/errors";
import { TypeChecker, ValueType } from "../src/code-analysis/type-checker";
import { clearTerminal } from "../src/utility";
import Parser from "../src/code-analysis/parser";
import Binder from "../src/code-analysis/type-checker/binder";
import Resolver from "../src/code-analysis/resolver";
import Interpreter from "../src/runtime/interpreter";
import PValue from "../src/runtime/types/value";
import ASTViewer from "./classes/ast-viewer";
import pkg = require("../package.json");

interface PExecutionOptions {
  outputAST: boolean;
  outputBoundAST: boolean;
  outputResult: boolean;
}

const os = platform();

export default class P {
  private binder = new Binder;
  private resolver = new Resolver;
  public typeChecker = new TypeChecker;
  public interpreter = new Interpreter(this, this.resolver, this.binder);
  private replActive = false;
  private replIndentation = 0;

  public version = "v" + pkg.version;
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

  public startREPL(): void {
    this.outputVersion();
    const enclosingOutputEnabled = this.executionOptions.outputResult;
    this.executionOptions.outputResult = true;
    this.replActive = true;

    while (this.replActive) {
      const line = reader.question("» ".green);
      if (!line.trim()) continue;
      if (this.didInputDirectives(line)) continue;

      if (!this.replActive) break;
      if (line.endsWith("{"))
        this.doString(this.readBlock(line));
      else
        this.doString(line);
    }

    this.executionOptions.outputResult = enclosingOutputEnabled;
  }

  public stopREPL(): void {
    this.replActive = false;
  }

  public refreshResources(): void {
    this.binder = new Binder;
    this.resolver = new Resolver;
    this.typeChecker = new TypeChecker;
    this.interpreter = new Interpreter(this, this.resolver, this.binder);
  }

  private didInputDirectives(code: string): boolean {
    switch (code.toLowerCase()) {
      case "@clear": {
        clearTerminal();
        this.outputVersion();
        return true;
      }
      case "@ast": {
        this.executionOptions.outputAST = !this.executionOptions.outputAST;
        console.log(`AST output has been turned ${this.executionOptions.outputAST ? "on".green : "off".red}`.gray(16).gray_bg(6));
        return true;
      }
      case "@bound_ast": {
        this.executionOptions.outputBoundAST = !this.executionOptions.outputBoundAST;
        console.log(`Bound AST output has been turned ${this.executionOptions.outputBoundAST ? "on".green : "off".red}`.gray(16).gray_bg(6));
        return true;
      }
      case "@results": {
        this.executionOptions.outputResult = !this.executionOptions.outputResult;
        console.log(`Interpreter result output has been turned ${this.executionOptions.outputResult ? "on".green : "off".red}`.gray(16).gray_bg(6));
        return true;
      }
      case "@show_trace": {
        PError.showTrace = !PError.showTrace;
        console.log(`Full error traces have been turned ${this.executionOptions.outputResult ? "on".green : "off".red}`.gray(16).gray_bg(6));
        return true;
      }
      case "@ast_viewer": {
        this.stopREPL();
        this.refreshResources();
        ASTViewer.start(this.binder);
        this.refreshResources();
        break;
      }
    }

    return false;
  }

  private readBlock(firstLine: string): string {
    let code = firstLine;
    this.replIndentation++;

    while (!code.endsWith("}")) {
      const line = reader.question("...".repeat(this.replIndentation).gray(8) + " ");

      if (line.endsWith("{") && !line.startsWith("}"))
        code += this.readBlock(line) + " ";
      else
        code += line;
    }

    this.replIndentation--;
    return code;
  }

  private outputVersion(): void {
    console.log(`P ${this.version} on ${os}`);
  }
}