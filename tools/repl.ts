#!/usr/bin/env node
<<<<<<< HEAD:src/repl.ts
import Parser from "./code-analysis/parser";
import { Lexer } from "./code-analysis/syntax/lexer";
import { readln } from "./lib/utilities";
=======
import { Lexer } from "../src/code-analysis/syntax/lexer";
import { readln } from "../src/lib/utilities";
>>>>>>> 4b7abf0b2a01cd06b950cf6b22ab6308b22dc240:tools/repl.ts

async function main() {
    console.log("Welcome to the PLANG repl!");

    while (true) {
        const code = await readln("> ");
        if (!code.trim()) continue;

        const parser = new Parser(code);
        const ast = parser.parse();
        console.log(ast)
    }
}

main().catch((error) => {
    console.error("An error occurred:", error);
});
