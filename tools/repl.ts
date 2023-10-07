import reader from "readline-sync";
import { platform } from "os";

import { PError } from "../src/errors";
import { clearTerminal } from "../src/utility";
import type P from "./p";

const os = platform();

export default class REPL {
  private active = false;
  private indentation = 0;

  public constructor(
    private readonly p: P
  ) {}

  public start(): void {
    this.outputVersion();
    const enclosingOutputEnabled = this.p.executionOptions.outputResult;
    this.p.executionOptions.outputResult = true;
    this.active = true;

    while (this.active) {
      const line = reader.question("» ".green);
      if (!line.trim()) continue;
      if (this.didInputDirectives(line)) continue;

      if (!this.active) break;
      if (line.endsWith("{"))
        this.p.doString(this.readBlock(line));
      else
        this.p.doString(line);
    }

    this.p.executionOptions.outputResult = enclosingOutputEnabled;
  }

  public stop(): void {
    this.active = false;
  }

  private didInputDirectives(code: string): boolean {
    switch (code.toLowerCase()) {
      case "@clear": {
        clearTerminal();
        this.outputVersion();
        return true;
      }
      case "@tokens": {
        this.p.executionOptions.outputTokens = !this.p.executionOptions.outputTokens;
        console.log(`Tokenization output has been turned ${this.p.executionOptions.outputTokens ? "on".green : "off".red}`.gray(18).gray_bg(6));
        return true;
      }
      case "@ast": {
        this.p.executionOptions.outputAST = !this.p.executionOptions.outputAST;
        console.log(`AST output has been turned ${this.p.executionOptions.outputAST ? "on".green : "off".red}`.gray(18).gray_bg(6));
        return true;
      }
      case "@bound_ast": {
        this.p.executionOptions.outputBoundAST = !this.p.executionOptions.outputBoundAST;
        console.log(`Bound AST output has been turned ${this.p.executionOptions.outputBoundAST ? "on".green : "off".red}`.gray(18).gray_bg(6));
        return true;
      }
      case "@results": {
        this.p.executionOptions.outputResult = !this.p.executionOptions.outputResult;
        console.log(`Interpreter result output has been turned ${this.p.executionOptions.outputResult ? "on".green : "off".red}`.gray(18).gray_bg(6));
        return true;
      }
      case "@show_trace": {
        PError.showTrace = !PError.showTrace;
        console.log(`Full error traces have been turned ${this.p.executionOptions.outputResult ? "on".green : "off".red}`.gray(18).gray_bg(6));
        return true;
      }
    }

    return false;
  }

  private readBlock(firstLine: string): string {
    let code = firstLine;
    this.indentation++;

    while (!code.endsWith("}")) {
      const line = reader.question("...".repeat(this.indentation).gray(8) + " ");

      if (line.endsWith("{") && !line.startsWith("}"))
        code += this.readBlock(line) + " ";
      else
        code += line;
    }

    this.indentation--;
    return code;
  }

  private outputVersion(): void {
    console.log(`P ${this.p.version} on ${os}`);
  }
}