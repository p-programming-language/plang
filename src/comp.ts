#!/usr/bin/env node
import { readFileSync } from 'fs';
import { Lexer} from './syntax-analysis/lexer';

function main() {
    const args = process.argv.slice(2);

    if (args.length !== 1) {
        console.error('Usage: pcomp <file>');
        process.exit(1);
    }

    const [filePath] = args;

    try {
        const fileContents = readFileSync(filePath, 'utf-8');
        const lexer = new Lexer(fileContents);
        const tokens = lexer.tokenize();
        console.log(tokens);
    } catch (error: any) {
        console.error(`An error occurred: ${error.message}`);
        process.exit(1);
    }
}

main();
