#!/usr/bin/env node
import P from "./p";

function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error(`
Usage: p <file> [argv...]

pint ~ The P Interpreter
--------------------------
Options:

<file>  - the input file
[argv...] - additional arguments
`);
    process.exit(1);
  }

  const [filePath, ...additionalArgs] = args;
  const p = new P;
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
