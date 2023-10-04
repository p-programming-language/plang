#!/usr/bin/env node
import { platform } from "os";
import { readln, clearTerminal } from "../src/lib/utility";
import P from "./p";

const os = platform();
const outputTitle = () =>
  console.log(`prepl v0.1.5 on ${os}`);

async function main() {
  const p = new P;

  outputTitle();
  while (true) {
    const code = await readln(">>> ");
    if (!code.trim()) continue;

    switch(code) {
      case "@clear": {
        clearTerminal();
        outputTitle();
        break;
      }
      case "@ast": {
        p.executionOptions.outputAST = !p.executionOptions.outputAST;
        console.log(`AST output has been turned ${p.executionOptions.outputAST ? "on" : "off"}`);
        break;
      }
      case "@bound_ast": {
        p.executionOptions.outputBoundAST = !p.executionOptions.outputBoundAST;
        console.log(`Bound AST output has been turned ${p.executionOptions.outputBoundAST ? "on" : "off"}`);
        break;
      }
      default: {
        p.doString(code);
        break;
      }
    }
  }
}

main().catch((error) => {
  console.error("An error occurred:", error);
});
