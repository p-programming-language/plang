import { TokenizationError } from "../errors";
import Syntax from "./syntax-type";
import Token from "./token";

export class Lexer {
    private position = 0;
    private line = 1;
    private col = 1;
    private currentLexemeCharacters: string[] = [];
    private readonly tokens: Token[] = []

    public constructor(
        private readonly source: string
    ) {}

    public tokenize(): Token[] {
        while (!this.isEndOfFile)
            this.lex();

        return this.tokens;
    }

    private lex(): void {
        const char = this.currentCharacter;
        switch(char) {
            default: {
                if (/^[0-9]$/.test(char))
                    return this.readNumber();

                throw new TokenizationError(`Unexpected character: ${char}`);
            }
        }
    }

    private readNumber(): void {
        let lexeme = "";
        let usedDecimal = false;

        while (/^[0-9]$/.test(this.currentCharacter) || this.currentCharacter === ".") {
            const char = this.advance();
            lexeme += char;
            if (char === ".")
                if (usedDecimal)
                    throw new TokenizationError(`Malformed number: ${lexeme}`);
                else
                    usedDecimal = true;
        }

        this.addToken(usedDecimal ? Syntax.FLOAT : Syntax.INT, parseFloat(lexeme));
    }

    private addToken(type: Syntax, value?: unknown): void {
        const currentLexeme = this.currentLexemeCharacters.join("");
        this.tokens.push({
            lexeme: currentLexeme,
            syntax: type,
            value
        })
        this.currentLexemeCharacters = [];
    }

    private peek(offset = 1): string | undefined {
        const peekPosition = this.position + offset;
        return peekPosition + 1 >= this.source.length ? undefined : this.source[peekPosition];
    }

    private advance(): string {
        const char = this.currentCharacter;
        if (char === "\n") {
            this.line++;
            this.col = 0;
        } else {
            this.col++;
        }

        this.position++;
        return char
    }


    private get isEndOfFile(): boolean {
        return this.position >= this.source.length;
    }

    private get currentCharacter(): string {
        return this.peek(0)!;
    }

    private get currentLocation(): { line: number; col: number } {
        return { line: this.line, col: this.col };
    }
}
