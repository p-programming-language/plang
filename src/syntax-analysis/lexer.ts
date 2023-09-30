import { TokenizationError } from "../errors";
import { Token, Location, ValueType, LocationSpan } from "./token";
import { KEYWORDS, TYPE_KEYWORDS } from "./keywords";
import Syntax from "./syntax-type";

const ALPHABETICAL = /[a-zA-Z]/;
const NUMERIC = /^[0-9]$/;
const WHITESPACE = /\s+/;

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
            case "(":
                return this.addToken(Syntax.LPAREN);
            case ")":
                return this.addToken(Syntax.LPAREN);
            case "[":
                return this.addToken(Syntax.LBRACKET);
            case "]":
                return this.addToken(Syntax.RBRACKET);
            case "{":
                return this.addToken(Syntax.LBRACE);
            case "}":
                return this.addToken(Syntax.RBRACE);
            case ".":
                return this.addToken(Syntax.DOT);
            case ":":
                return this.addToken(Syntax.COLON);
            case ">": {
                if (this.match("="))
                    return this.addToken(Syntax.GTE);
                else
                    return this.addToken(Syntax.GT);
            }
            case "<": {
                if (this.match("="))
                    return this.addToken(Syntax.LTE);
                else
                    return this.addToken(Syntax.LT);
            }
            case "+": {
                if (this.match("="))
                    return this.addToken(Syntax.PLUS_EQUAL);
                else if (this.match("+"))
                    return this.addToken(Syntax.PLUS_PLUS);
                else
                    return this.addToken(Syntax.PLUS);
            }
            case "-": {
                if (this.match("="))
                    return this.addToken(Syntax.MINUS_EQUAL);
                else if (this.match("-"))
                    return this.addToken(Syntax.MINUS_MINUS);
                else
                    return this.addToken(Syntax.MINUS);
            }
            case "*": {
                if (this.match("="))
                    return this.addToken(Syntax.STAR_EQUAL);
                else
                    return this.addToken(Syntax.STAR);
            }
            case "/": {
                if (this.match("="))
                    return this.addToken(Syntax.SLASH_EQUAL);
                else
                    return this.addToken(Syntax.SLASH);
            }
            case "^": {
                if (this.match("="))
                    return this.addToken(Syntax.CARAT_EQUAL);
                else
                    return this.addToken(Syntax.CARAT);
            }
            case "%": {
                if (this.match("="))
                    return this.addToken(Syntax.PERCENT_EQUAL);
                else
                    return this.addToken(Syntax.PERCENT);
            }
            case "=": {
                if (this.match("="))
                    return this.addToken(Syntax.EQUAL_EQUAL);
                else
                    return this.addToken(Syntax.EQUAL);
            }

            case '"':
            case "'":
                return this.readString();

            default: {
                if (NUMERIC.test(char))
                    return this.readNumber();
                else if (WHITESPACE.test(char)) {
                    this.advance();
                    return;
                } else if (ALPHABETICAL.test(char)) {
                    const identifierLexeme = this.readIdentifier();
                    const keywordSyntax = KEYWORDS[identifierLexeme];
                    const typeKeywordSyntax = TYPE_KEYWORDS[identifierLexeme];
                    if (keywordSyntax)
                        this.addToken(keywordSyntax);
                    else if (typeKeywordSyntax)
                        this.addToken(typeKeywordSyntax);
                    else if (identifierLexeme === "true")
                        this.addToken(Syntax.BOOLEAN, true);
                    else if (identifierLexeme === "false")
                        this.addToken(Syntax.BOOLEAN, false);
                    else
                        this.addToken(Syntax.IDENTIFIER);

                    return;
                }

                throw new TokenizationError(`Unexpected character: ${char}`);
            }
        }
    }

    private readIdentifier(): string {
        let lexeme = "";
        while (!this.isEndOfFile && (ALPHABETICAL.test(this.currentCharacter) || NUMERIC.test(this.currentCharacter)))
            lexeme += this.advance();

        return lexeme;
    }

    private readString(): void {
        const delimiter = this.advance();
        while (this.currentCharacter !== delimiter) {
            if (this.advance() === "\n")
                throw new TokenizationError("Unterminated string literal");
        }

        this.advance(); // advance final delimiter
        const stringContents = this.currentLexeme.slice(1, -1);
        this.addToken(Syntax.STRING, stringContents);
    }

    private readNumber(): void {
        let usedDecimal = false;
        while (/^[0-9]$/.test(this.currentCharacter) || this.currentCharacter === ".") {
            if (this.advance() === ".")
                if (usedDecimal)
                    throw new TokenizationError("Malformed number");
                else
                    usedDecimal = true;
        }

        this.addToken(usedDecimal ? Syntax.FLOAT : Syntax.INT, parseFloat(this.currentLexeme));
    }


    private addToken<T extends ValueType = ValueType>(type: Syntax, value?: T): void {
        const locationSpan = new LocationSpan(this.lastLocation, this.currentLocation);
        this.tokens.push(new Token(type, this.currentLexeme, value, locationSpan));
        this.currentLexemeCharacters = [];
        this.lastLocation = this.currentLocation;
    }

    private match(char: string): boolean {
        if (this.peek() === char) {
            this.advance();
            return true;
        }

        return false;
    }

    private advance(): string {
        const char = this.currentCharacter;
        const isWhiteSpace = /\s+/.test(char);
        if (!isWhiteSpace) // don't add to lexeme if whitespace
            this.currentLexemeCharacters.push(char);

        if (char === "\n") {
            this.line++;
            this.column = 1;
            this.lastLocation = this.currentLocation;
        } else
            this.column++;

        this.position++;
        if (isWhiteSpace)
            this.lastLocation = this.currentLocation;

        return char
    }

    private peek(offset = 1): string | undefined {
        const peekPosition = this.position + offset;
        return peekPosition + 1 > this.source.length ? undefined : this.source[peekPosition];
    }

    private get isEndOfFile(): boolean {
        return this.position + 1 > this.source.length;
    }

    private get currentLexeme(): string {
        return this.currentLexemeCharacters.join("");
    }

    private get currentCharacter(): string {
        return this.peek(0)!;
    }

    private get currentLocation(): Location {
        return new Location(this.line, this.column);
    }
}
