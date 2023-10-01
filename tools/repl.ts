#!/usr/bin/env node
import { Lexer } from "../src/code-analysis/syntax/lexer";
import { readln } from "../src/lib/utilities";

async function main() {
    console.log("Welcome to the PLANG repl!");

    while (true) {
        const code = await readln("> ");
        if (!code.trim()) continue;

        const lexer = new Lexer(code);
        const tokens = lexer.tokenize();
        for (const token of tokens)
            console.log(token.toString());
    }
}

main().catch((error) => {
    console.error("An error occurred:", error);
});
