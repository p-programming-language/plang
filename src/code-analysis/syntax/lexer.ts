import { TokenizationError } from "../../errors";
import { Token, Location, ValueType, LocationSpan } from "./token";
import { KEYWORDS, TYPE_KEYWORDS } from "./keywords";
import ArrayStepper from "../array-stepper";
import Syntax from "./syntax-type";

const ALPHABETICAL = /[a-zA-Z]/;
const NUMERIC = /^[0-9]$/;
const WHITESPACE = /\s+/;

export class Lexer extends ArrayStepper<string> {
  private line = 1;
  private column = 1;
  private lastLocation = new Location(this.line, this.column);
  private currentLexemeCharacters: string[] = [];
  private readonly tokens: Token[] = []

  public tokenize(): Token[] {
    while (!this.isFinished)
      this.lex();

    this.addToken(Syntax.EOF);
    return this.tokens;
  }

  private lex(): void {
    const char = this.current;
    switch (char) {
      case "(":
        return this.addToken(Syntax.LPAREN, undefined, true);
      case ")":
        return this.addToken(Syntax.RPAREN, undefined, true);
      case "[":
        return this.addToken(Syntax.LBRACKET, undefined, true);
      case "]":
        return this.addToken(Syntax.RBRACKET, undefined, true);
      case "{":
        return this.addToken(Syntax.LBRACE, undefined, true);
      case "}":
        return this.addToken(Syntax.RBRACE, undefined, true);
      case ".":
        return this.addToken(Syntax.DOT, undefined, true);
      case ":":
        return this.addToken(Syntax.COLON, undefined, true);
      case ">": {
        if (this.match("="))
          return this.addToken(Syntax.GTE, undefined, true);
        else
          return this.addToken(Syntax.GT, undefined, true);
      }
      case "<": {
        if (this.match("="))
          return this.addToken(Syntax.LTE, undefined, true);
        else
          return this.addToken(Syntax.LT, undefined, true);
      }
      case "+": {
        if (this.match("="))
          return this.addToken(Syntax.PLUS_EQUAL, undefined, true);
        else if (this.match("+"))
          return this.addToken(Syntax.PLUS_PLUS, undefined, true);
        else
          return this.addToken(Syntax.PLUS, undefined, true);
      }
      case "-": {
        if (this.match("="))
          return this.addToken(Syntax.MINUS_EQUAL, undefined, true);
        else if (this.match("-"))
          return this.addToken(Syntax.MINUS_MINUS, undefined, true);
        else
          return this.addToken(Syntax.MINUS, undefined, true);
      }
      case "*": {
        if (this.match("="))
          return this.addToken(Syntax.STAR_EQUAL, undefined, true);
        else
          return this.addToken(Syntax.STAR, undefined, true);
      }
      case "/": {
        if (this.match("="))
          return this.addToken(Syntax.SLASH_EQUAL, undefined, true);
        else
          return this.addToken(Syntax.SLASH, undefined, true);
      }
      case "^": {
        if (this.match("="))
          return this.addToken(Syntax.CARAT_EQUAL, undefined, true);
        else
          return this.addToken(Syntax.CARAT, undefined, true);
      }
      case "%": {
        if (this.match("="))
          return this.addToken(Syntax.PERCENT_EQUAL, undefined, true);
        else
          return this.addToken(Syntax.PERCENT, undefined, true);
      }
      case "=": {
        if (this.match("="))
          return this.addToken(Syntax.EQUAL_EQUAL, undefined, true);
        else
          return this.addToken(Syntax.EQUAL, undefined, true);
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
    while (!this.isFinished && (ALPHABETICAL.test(this.current) || NUMERIC.test(this.current)))
      lexeme += this.advance();

    return lexeme;
  }

  private readString(): void {
    const delimiter = this.advance();
    while (this.current !== delimiter) {
      if (this.advance(true) === "\n")
        throw new TokenizationError("Unterminated string literal");
    }

    this.advance(); // advance final delimiter
    const stringContents = this.currentLexeme.slice(1, -1);
    this.addToken(Syntax.STRING, stringContents);
  }

  private readNumber(): void {
    let usedDecimal = false;
    while (/^[0-9]$/.test(this.current) || this.current === ".") {
      if (this.advance() === ".")
        if (usedDecimal)
          throw new TokenizationError("Malformed number");
        else
          usedDecimal = true;
    }

    this.addToken(usedDecimal ? Syntax.FLOAT : Syntax.INT, parseFloat(this.currentLexeme));
  }


  private addToken<T extends ValueType = ValueType>(type: Syntax, value?: T, advance = false): void {
    if (advance)
      this.advance();

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

  private advance(allowWhitespace = false): string {
    const char = this.current;
    const isWhiteSpace = /\s+/.test(char);
    if (!isWhiteSpace || allowWhitespace) // don't add to lexeme if whitespace
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

  private get currentLexeme(): string {
    return this.currentLexemeCharacters.join("");
  }

  private get currentLocation(): Location {
    return new Location(this.line, this.column);
  }
}
