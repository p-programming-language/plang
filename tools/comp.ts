#!/usr/bin/env node
import { readFileSync } from "fs";
import { Lexer } from "../src/code-analysis/syntax/lexer";

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
        const lexer = new Lexer(fileContents);
        const tokens = lexer.tokenize();
        for (const token of tokens)
            console.log(token.toString());;
    } catch (error: any) {
        console.error(`${error.message}`);
        process.exit(1);
    }
}

main();
