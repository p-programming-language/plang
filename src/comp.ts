#!/usr/bin/env node
import { readFileSync } from 'fs';
import { tokenize, Token } from './plang';

function main() {
    const args = process.argv.slice(2);

    if (args.length !== 1) {
        console.error('Usage: pcomp <file>');
        process.exit(1);
    }

    const filePath = args[0];

    try {
        const fileContents = readFileSync(filePath, 'utf-8');

        const tokens: Token[] = tokenize(fileContents);
        console.log(tokens);
    } catch (error: any) {
        console.error(`An error occurred: ${error.message}`);
        process.exit(1);
    }
}

main();
