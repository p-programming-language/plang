import { Lexer } from "./code-analysis/lexer";


async function main() {
    let code = `
    1
    2
    `

    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    console.log(tokens);
}

main().catch((error) => {
    console.error("An error occurred:", error);
});