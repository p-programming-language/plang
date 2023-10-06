#!/usr/bin/env node
import P from "./p";

const USAGE = `
Usage: p <file> [argv...]

pint ~ The P Interpreter
--------------------------
Options:

  <file>  - the input file
  [argv...] - additional arguments
`;

function main() {
  const args = process.argv.slice(2);
  const p = new P;

  if (args.length > 1) {
    console.error(USAGE);
    process.exit(1);
  } else if (args.length === 0)
    return p.startREPL();

  const [filePath] = args;
  try {
    p.executionOptions.outputAST = false;
    p.executionOptions.outputBoundAST = false;
    p.executionOptions.outputResult = false;
    p.doFile(filePath);
  } catch (error: any) {
    console.error(`${error.message}`);
    process.exit(1);
  }
}

main();
