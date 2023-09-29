import { TokenizationError } from "./errors";

enum TokenType {
    INT = "INT",
    FLOAT = "FLOAT"
}

export type Token = {
    syntax: TokenType;
    lexeme: string;
    value: any;
}

class Lexer {
    private position = 0;
    private line = 1;
    private col = 1;

    public constructor(
        private readonly source: string
    ) {}

    public peek(offset = 1): string | undefined {
        const peekPosition = this.position + offset;
        return peekPosition >= this.source.length ? undefined : this.source[peekPosition];
    }

    public advance(): void {
        const char = this.getCurrentCharacter();
        
        if (char === "\n") {
            this.line++;
            this.col = 1;
        } else {
            this.col++;
        }
    
        if (!this.isEndOfFile()) {
            this.position++;
        }
    }
    

    public isEndOfFile(): boolean {
        return this.position >= this.source.length;
    }

    public getCurrentCharacter(): string {
        return this.source[this.position];
    }

    public getCurrentPosition(): { line: number; col: number } {
        return { line: this.line, col: this.col };
    }
}

export function tokenize(input: string): Token[] {
    const tokens: Token[] = [];
    const lexer = new Lexer(input);

    while (!lexer.isEndOfFile()) {
        const char = lexer.getCurrentCharacter();

        if (/^[0-9]$/.test(char) || (char === '.' && /^[0-9]$/.test(lexer.peek() || ''))) {
            let lexeme = char;
            let isFloat = false;

            while (!lexer.isEndOfFile() && (
                /^[0-9]$/.test(lexer.peek() || '') || (!isFloat && lexer.peek() === '.')
            )) {
                if (lexer.peek() === '.') {
                    isFloat = true;
                }
                lexeme += lexer.peek() || '';
                lexer.advance();
            }

            tokens.push({
                syntax: isFloat ? TokenType.FLOAT : TokenType.INT,
                lexeme: lexeme,
                value: isFloat ? parseFloat(lexeme) : parseInt(lexeme)
            });
        } else if (char === '\n') {
            lexer.advance();
        } else {
            throw new TokenizationError(`Unexpected character: ${char} at line ${lexer.getCurrentPosition().line}, column ${lexer.getCurrentPosition().col}`);
        }

        lexer.advance();
    }

    return tokens;
}

