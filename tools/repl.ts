#!/usr/bin/env node
import { readln } from "../src/lib/utilities";
import Parser from "../src/code-analysis/parser";

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
