import { Token } from "./code-analysis/syntax/token";

const TESTING = false;

export class PError {
  public constructor(
    public readonly name: string,
    public readonly message: string,
    public readonly line: number,
    public readonly column: number
  ) {

    const output = `${name}: ${message}\n  at ${line}:${column}`;
    TESTING ? new Error(output) : console.log(output);
    process.exit(1);
  }
}

export class TokenizationError extends PError {
  public constructor(message: string, line: number, column: number) {
    super(TokenizationError.name, message, line, column);
  }
}

export class ParsingError extends PError {
  public constructor(message: string, token: Token) {
    super(ParsingError.name, message, token.locationSpan.start.line, token.locationSpan.start.column);
  }
}

export class TypeError extends PError {
  public constructor(message: string, token: Token) {
    super(TypeError.name, message, token.locationSpan.start.line, token.locationSpan.start.column);
  }
}

export class BindingError extends PError {
  public constructor(message: string, token: Token) {
    super(BindingError.name, message, token.locationSpan.start.line, token.locationSpan.start.column);
  }
}

export class ResolutionError extends PError {
  public constructor(message: string, token: Token) {
    super(ResolutionError.name, message, token.locationSpan.start.line, token.locationSpan.start.column);
  }
}