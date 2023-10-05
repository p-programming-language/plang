#!/usr/bin/env node
import P from "./p";

function main() {
  const args = process.argv.slice(2);

  if (args.length !== 1) {
    console.error(`
Usage: p <file>

pint ~ The P Interpreter
--------------------------
Options:

<file>  - the input file
`);
    process.exit(1);
  }

  const [filePath] = args;
  const p = new P;
  try {
    p.doFile(filePath);
  } catch (error: any) {
    console.error(`${error.message}`);
    process.exit(1);
  }
}

main();
