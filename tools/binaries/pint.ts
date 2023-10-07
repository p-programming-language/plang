#!/usr/bin/env node
import P from "../p";

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
  const [filePath] = args;
  const p = new P(filePath ?? "repl");

  // TODO: use a command handler so we can also have a -- option
  if (args.includes("--help") || args.includes("-h"))
    return console.log(USAGE);

  if (args.length === 0)
    return p.repl.start();

  p.executionOptions.outputAST = false;
  p.executionOptions.outputBoundAST = false;
  p.executionOptions.outputResult = false;
  p.doFile(filePath);
}

main();
