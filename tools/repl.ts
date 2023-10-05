#!/usr/bin/env node
import { platform } from "os";
import { readln, clearTerminal } from "../src/utility";
import { PError } from "../src/errors";
import P from "./p";
import "colors.ts";

const os = platform();
const outputTitle = () =>
  console.log(`prepl v0.1.5 on ${os}`);

let indentation = 0;
async function main(): Promise<void> {
  const p = new P;
  p.executionOptions.outputResult = true;
  outputTitle();


  while (true) {
    const line = await readln("» ".green);
    if (!line.trim()) continue;
    if (hasDirectives(line, p)) continue;

    if (line.endsWith("{"))
      p.doString(await readBlock(line));
    else
      p.doString(line);
  }
}

async function readBlock(firstLine: string): Promise<string> {
  let code = firstLine;
  indentation++;

  while (!code.endsWith("}")) {
    const line = await readln("...".repeat(indentation) + " ");
    if (line.endsWith("{"))
      code += await readBlock(line) + " ";
    else
      code += line;
  }

  indentation--;
  return code;
}

main().catch((error) => {
  console.error("An error occurred:", error);
});

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

