import { tokenize, Token } from "./plang";


async function main() {
    let code = `
    1
    2
    `

    let tokens: Token[] = tokenize(code);
    console.log(tokens);
}

main().catch((error) => {
    console.error('An error occurred:', error);
});