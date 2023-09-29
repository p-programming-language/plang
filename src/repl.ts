import { tokenize, Token} from "./plang";
import { readln } from "./lib/utilities";

async function main() {
    console.log("Welcome to the PLANG repl!");

    while (true) {
            const code = await readln("> ");
            if (!code.trim()) {
                continue;
            }

            let tokens: Token[] = tokenize(code)
            console.log(tokens)
    }
}

main().catch((error) => {
    console.error('An error occurred:', error);
});
