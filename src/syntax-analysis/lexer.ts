import { TokenizationError } from "../errors";
import { Token, Location, ValueType, LocationSpan } from "./token";
import Syntax from "./syntax-type";

export class Lexer {
    private position = 0;
    private line = 1;
    private column = 1;
    private lastLocation = new Location(this.line, this.column);
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
                else if (/\s+/.test(char)) {
                    this.advance();
                    return;
                }

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
                    throw new TokenizationError("Malformed number");
                else
                    usedDecimal = true;
        }

        this.addToken(usedDecimal ? Syntax.FLOAT : Syntax.INT, parseFloat(lexeme));
    }

    private addToken<T extends ValueType = ValueType>(type: Syntax, value?: T): void {
        const currentLexeme = this.currentLexemeCharacters.join("");
        const locationSpan = new LocationSpan(this.lastLocation, this.currentLocation);
        this.tokens.push(new Token(type, currentLexeme, value, locationSpan));
        this.currentLexemeCharacters = [];
        this.lastLocation = this.currentLocation;
    }

    private advance(): string {
        const char = this.currentCharacter;
        if (!/\s+/.test(char)) // don't add to lexeme if whitespace
            this.currentLexemeCharacters.push(char);

        if (char === "\n") {
            this.line++;
            this.column = 0;
        } else {
            this.column++;
        }

        this.position++;
        return char
    }

    private peek(offset = 1): string | undefined {
        const peekPosition = this.position + offset;
        return peekPosition + 1 > this.source.length ? undefined : this.source[peekPosition];
    }

    private get isEndOfFile(): boolean {
        return this.position + 1 > this.source.length;
    }

    private get currentCharacter(): string {
        return this.peek(0)!;
    }

    private get currentLocation(): Location {
        return new Location(this.line, this.column);;
    }
}
