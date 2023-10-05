#!/usr/bin/env node
import reader from "readline-sync";
import { platform } from "os";

import { clearTerminal } from "../src/utility";
import { PError } from "../src/errors";
import P from "./p";
import "colors.ts";

const p = new P;
const os = platform();
const outputTitle = () =>
  console.log(`P ${p.version} on ${os}`);

p.executionOptions.outputResult = true;
outputTitle();

let indentation = 0;
while (true) {
  const line = reader.question("» ".green);
  if (!line.trim()) continue;
  if (hasDirectives(line, p)) continue;

  if (line.endsWith("{"))
    p.doString(readBlock(line));
  else
    p.doString(line);
}

function readBlock(firstLine: string): string {
  let code = firstLine;
  indentation++;

  while (!code.endsWith("}")) {
    const line = reader.question("...".repeat(indentation) + " ");
    if (line.endsWith("{"))
      code += readBlock(line) + " ";
    else
      code += line;
  }

  indentation--;
  return code;
}

function hasDirectives(code: string, p: P): boolean {
  switch (code) {
    case "@clear": {
      clearTerminal();
      outputTitle();
      return true;
    }
    case "@ast": {
      p.executionOptions.outputAST = !p.executionOptions.outputAST;
      console.log(`AST output has been turned ${p.executionOptions.outputAST ? "on" : "off"}`);
      return true;
    }
    case "@bound_ast": {
      p.executionOptions.outputBoundAST = !p.executionOptions.outputBoundAST;
      console.log(`Bound AST output has been turned ${p.executionOptions.outputBoundAST ? "on" : "off"}`);
      return true;
    }
    case "@results": {
      p.executionOptions.outputResult = !p.executionOptions.outputResult;
      console.log(`Interpreter result output has been turned ${p.executionOptions.outputResult ? "on" : "off"}`);
      return true;
    }
    case "@show_trace": {
      PError.showTrace = !PError.showTrace;
      console.log(`Full error traces have been turned ${p.executionOptions.outputResult ? "on" : "off"}`);
      return true;
    }
  }

  return false;
}

