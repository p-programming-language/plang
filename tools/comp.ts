#!/usr/bin/env node
import { readFileSync } from "fs";
import Parser from "../src/code-analysis/parser";

function main() {
    const args = process.argv.slice(2);

    if (args.length !== 1) {
        console.error(`
Usage: gpc <file>

GPC ~ Goofy Plang Compiler
--------------------------
Options:

<file>  - the input file
`);
        process.exit(1);
    }

    const [filePath] = args;
    try {
        const fileContents = readFileSync(filePath, "utf-8");
        const parser = new Parser(fileContents);
        const ast = parser.parse();
        console.log(ast.toString());
    } catch (error: any) {
        console.error(`${error.message}`);
        process.exit(1);
    }
}

main();
