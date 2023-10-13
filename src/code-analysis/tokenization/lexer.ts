import { LexerSyntaxError } from "../../errors";
import { Token, Location, LocationSpan } from "./token";
import { ValueType } from "../type-checker";
import { KEYWORDS } from "./keywords";
import ArrayStepper from "../array-stepper";
import Syntax from "./syntax-type";

const VALID_IDENTIFIER = /[a-zA-Z_$]/;
const NUMERIC = /^[0-9]$/;
const WHITESPACE = /\s+/;

interface CommentOptions {
  readonly multiline: boolean;
}

export default class Lexer extends ArrayStepper<string> {
  private line = 1;
  private column = 1;
  private lastLocation = new Location(this.line, this.column);
  private currentLexemeCharacters: string[] = [];
  private readonly tokens: Token[] = []

  /**
   * Lexes the entire input
   */
  public tokenize(): Token[] {
    while (!this.isFinished)
      this.lex();

    this.currentLexemeCharacters = [];
    this.addToken(Syntax.EOF);
    return this.tokens;
  }

  /**
   * Lexes exactly one token
   */
  private lex(): void {
    const char = this.current;
    if (char === "\n") {
      this.advance();
      return;
    } if (WHITESPACE.test(char))
      return this.skipWhiteSpace();

    switch (char) {
      case ";":
        return this.addToken(Syntax.Semicolon, undefined, true);
      case ",":
        return this.addToken(Syntax.Comma, undefined, true);
      case "@":
        return this.addToken(Syntax.At, undefined, true);
      case "(":
        return this.addToken(Syntax.LParen, undefined, true);
      case ")":
        return this.addToken(Syntax.RParen, undefined, true);
      case "[":
        return this.addToken(Syntax.LBracket, undefined, true);
      case "]":
        return this.addToken(Syntax.RBracket, undefined, true);
      case "{":
        return this.addToken(Syntax.LBrace, undefined, true);
      case "}":
        return this.addToken(Syntax.RBrace, undefined, true);
      case ".":
        if (this.match("."))
          return this.addToken(Syntax.DotDot, undefined, true);
        else
          return this.addToken(Syntax.Dot, undefined, true);
      case "#":
        if (this.match("#"))
          return this.skipComment({ multiline: this.match(":") });
        else
          return this.addToken(Syntax.Hashtag, undefined, true);
      case "~":
        return this.addToken(Syntax.Tilde, undefined, true);
      case ":": {
        if (this.match("="))
          return this.addToken(Syntax.ColonEqual, undefined, true);
        else if (this.match(":"))
          return this.addToken(Syntax.ColonColon, undefined, true);
        else
          return this.addToken(Syntax.Colon, undefined, true);
      }
      case "?": {
        if (this.match("?"))
          if (this.match("="))
            return this.addToken(Syntax.QuestionQuestionEqual, undefined, true);
          else
            return this.addToken(Syntax.QuestionQuestion, undefined, true);
        else
          return this.addToken(Syntax.Question, undefined, true);
      }
      case "&": {
        if (this.match("="))
          return this.addToken(Syntax.AmpersandEqual, undefined, true);
        else if (this.match("&"))
          if (this.match("="))
            return this.addToken(Syntax.AmpersandAmpersandEqual, undefined, true);
          else
            return this.addToken(Syntax.AmpersandAmpersand, undefined, true);
        else
          return this.addToken(Syntax.Ampersand, undefined, true);
      }
      case "|": {
        if (this.match("="))
          return this.addToken(Syntax.PipeEqual, undefined, true);
        else if (this.match("|"))
          if (this.match("="))
            return this.addToken(Syntax.PipePipeEqual, undefined, true);
          else
            return this.addToken(Syntax.PipePipe, undefined, true);
        else
          return this.addToken(Syntax.Pipe, undefined, true);
      }
      case "!": {
        if (this.match("="))
          return this.addToken(Syntax.BangEqual, undefined, true);
        else
          return this.addToken(Syntax.Bang, undefined, true);
      }
      case ">": {
        if (this.match("="))
          return this.addToken(Syntax.GTE, undefined, true);
        else if (this.match(">"))
          return this.addToken(Syntax.RDoubleArrow, undefined, true);
        else
          return this.addToken(Syntax.GT, undefined, true);
      }
      case "<": {
        if (this.match("="))
          return this.addToken(Syntax.LTE, undefined, true);
        else if (this.match("<"))
          return this.addToken(Syntax.LDoubleArrow, undefined, true);
        else
          return this.addToken(Syntax.LT, undefined, true);
      }
      case "+": {
        if (this.match("="))
          return this.addToken(Syntax.PlusEqual, undefined, true);
        else if (this.match("+"))
          return this.addToken(Syntax.PlusPlus, undefined, true);
        else
          return this.addToken(Syntax.Plus, undefined, true);
      }
      case "-": {
        if (this.match("="))
          return this.addToken(Syntax.MinusEqual, undefined, true);
        else if (this.match("-"))
          return this.addToken(Syntax.MinusMinus, undefined, true);
        else
          return this.addToken(Syntax.Minus, undefined, true);
      }
      case "*": {
        if (this.match("*"))
          if (this.match("="))
            return this.addToken(Syntax.StarStarEqual, undefined, true);
          else
            return this.addToken(Syntax.StarStar, undefined, true);
        else if (this.match("="))
          return this.addToken(Syntax.StarEqual, undefined, true);
        else
          return this.addToken(Syntax.Star, undefined, true);
      }
      case "/": {
        if (this.match("="))
          return this.addToken(Syntax.SlashEqual, undefined, true);
        else if (this.match("/"))
          if (this.match("="))
            return this.addToken(Syntax.SlashSlashEqual, undefined, true);
          else
            return this.addToken(Syntax.SlashSlash, undefined, true);
        else
          return this.addToken(Syntax.Slash, undefined, true);
      }
      case "^": {
        if (this.match("="))
          return this.addToken(Syntax.CaratEqual, undefined, true);
        else
          return this.addToken(Syntax.Carat, undefined, true);
      }
      case "%": {
        if (this.match("="))
          return this.addToken(Syntax.PercentEqual, undefined, true);
        else
          return this.addToken(Syntax.Percent, undefined, true);
      }
      case "=": {
        if (this.match("="))
          return this.addToken(Syntax.EqualEqual, undefined, true);
        else
          return this.addToken(Syntax.Equal, undefined, true);
      }

      case '"':
      case "'":
        return this.readString();

      case "0": {
        const radixSymbols = ["x", "b", "o"];
        if ((this.peek() && !radixSymbols.includes(this.peek()!)) || !this.peek())
          return this.readNumber();

        this.advance();
        switch (this.advance()) {
          case "x": {
            while (!this.isFinished && /[A-Fa-f0-9]$/.test(this.current))
              this.advance();

            return this.addToken(Syntax.Int, parseInt(this.currentLexeme.slice(2), 16));
          }
          case "o": {
            while (!this.isFinished && /[0-7]/.test(this.current))
              this.advance();

            return this.addToken(Syntax.Int, parseInt(this.currentLexeme.slice(2), 8));
          }
          case "b": {
            while (!this.isFinished && /^[01]+$/.test(this.current))
              this.advance();

            return this.addToken(Syntax.Int, parseInt(this.currentLexeme.slice(2), 2));
          }
        }
      }

      default: {
        if (NUMERIC.test(char))
          return this.readNumber();

        else if (VALID_IDENTIFIER.test(char)) {
          const identifierLexeme = this.readIdentifier();
          const keywordSyntax = Object.keys(KEYWORDS).includes(identifierLexeme) ? KEYWORDS[<keyof typeof KEYWORDS>identifierLexeme] : false;
          if (keywordSyntax)
            this.addToken(keywordSyntax);
          else if (identifierLexeme === "true")
            this.addToken(Syntax.Boolean, true);
          else if (identifierLexeme === "false")
            this.addToken(Syntax.Boolean, false);
          else if (identifierLexeme === "null")
            this.addToken(Syntax.Null);
          else if (identifierLexeme === "undefined")
            this.addToken(Syntax.Undefined);
          else
            this.addToken(Syntax.Identifier);

          return;
        }

        throw new LexerSyntaxError(`Unexpected character: ${char}`, this.line, this.column);
      }
    }
  }

  /**
   * Skip current whitespace and all whitespaces after
   */
  private skipWhiteSpace(): void {
    while (WHITESPACE.test(this.current))
      this.advance();
  }

  /**
   * Skip comment syntax
   */
  private skipComment({ multiline }: CommentOptions): void {
    const condition = () => multiline ?
      this.current === ":" && this.peek() === "#" && this.peek(2) === "#"
      : this.current === "\n" || this.isFinished;

    const consumeEndOfComment = () => multiline ?
      this.advanceMultiple(3)
      : this.advance();

    while (!condition())
      this.advance();

    consumeEndOfComment();
    this.currentLexemeCharacters = [];
  }

  /**
   * Skip current whitespace and all whitespaces after
   */
  private readIdentifier(): string {
    let lexeme = "";

    while (!this.isFinished && (VALID_IDENTIFIER.test(this.current) || NUMERIC.test(this.current)))
      lexeme += this.advance();

    return lexeme;
  }

  private readString(): void {
    let escaping = false;
    const delimiter = this.advance();
    while (this.current !== delimiter || this.peek(-1) === "\\") {
      if (this.current === "\\") {
        this.advance();
        this.currentLexemeCharacters.pop(); // kill the stupid "//"
        escaping = true;
      } else if (escaping) {
        let resultSequence = "";
        const code = this.advance();
        this.currentLexemeCharacters.pop(); // kill the isolated sequence code
        switch (code) {
          case "\"": {
            resultSequence += "\"";
            break;
          }
          case "'": {
            resultSequence += "'";
            break;
          }
          case "\\": {
            resultSequence += "\\";
            break;
          }
          case "n": {
            resultSequence += "\n";
            break;
          }
          case "t": {
            resultSequence += "\t";
            break;
          }

          case "e": {
            if (this.current !== "[")
              throw new LexerSyntaxError("Invalid escape sequence: \\e escape sequence contained no '[' character", this.line, this.column);

            let contents = "";
            this.advance();
            this.currentLexemeCharacters.pop();
            while (<string>this.current !== "m") {
              contents += this.advance();
              this.currentLexemeCharacters.pop();
            }

            this.advance();
            this.currentLexemeCharacters.pop();
            resultSequence += `\x1b[${contents}m`;
            break;
          }
        }

        this.currentLexemeCharacters.push(resultSequence);
        escaping = false;
      } else if (this.advance(true) === "\n" || this.isFinished)
        throw new LexerSyntaxError("Unterminated string literal", this.line, this.column);
    }

    this.advance(); // advance final delimiter
    const stringContents = this.currentLexeme.slice(1, -1);
    this.addToken(Syntax.String, stringContents);
  }

  private readNumber(): void {
    let usedDecimal = false;
    while (/^[0-9]$/.test(this.current) || (this.current === "." && this.peek() !== ".")) {
      if (this.advance() === ".")
        if (usedDecimal)
          throw new LexerSyntaxError("Malformed number", this.line, this.column);
        else
          usedDecimal = true;
    }

    this.addToken(usedDecimal ? Syntax.Float : Syntax.Int, parseFloat(this.currentLexeme));
  }


  private addToken<T extends ValueType = ValueType>(type: Syntax, value?: T, advance = false): void {
    if (advance)
      this.advance();

    const locationSpan = new LocationSpan(this.lastLocation, this.currentLocation);
    this.tokens.push(new Token(type, this.currentLexeme, type === Syntax.Null ? null : value, locationSpan));
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

  private advanceMultiple(times: number, allowWhitespace?: boolean): void {
    for (let i = 0; i < times; i++)
      this.advance(allowWhitespace);
  }

  private advance(allowWhitespace = false): string {
    const char = this.current;
    const isWhiteSpace = WHITESPACE.test(char);
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

    return char;
  }

  private get currentLexeme(): string {
    return this.currentLexemeCharacters.join("");
  }

  private get currentLocation(): Location {
    return new Location(this.line, this.column);
  }
}
