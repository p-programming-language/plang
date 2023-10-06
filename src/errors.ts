import { Token } from "./code-analysis/tokenization/token";

export class PError {
  public static testing = false;
  public static showTrace = false;

  public constructor(
    public readonly name: string,
    public readonly message: string,
    public readonly line: number,
    public readonly column: number,
    hookedException = false
  ) {

    if (PError.testing || hookedException) return;
    const output = `${name}: ${message}\n  at ${line}:${column}`;

    if (PError.showTrace)
      throw new Error(output);
    else {
      console.log(output);
      process.exit(1);
    }
  }
}

export class LexerSyntaxError extends PError {
  public constructor(message: string, line: number, column: number) {
    super("SyntaxError", message, line, column);
  }
}

export class ParserSyntaxError extends PError {
  public constructor(message: string, token: Token) {
    super("SyntaxError", message, token.locationSpan.start.line, token.locationSpan.start.column);
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

export class ReferenceError extends PError {
  public constructor(message: string, token: Token) {
    super(ReferenceError.name, message, token.locationSpan.start.line, token.locationSpan.start.column);
  }
}

export class ResolutionError extends PError {
  public constructor(message: string, token: Token) {
    super(ResolutionError.name, message, token.locationSpan.start.line, token.locationSpan.start.column);
  }
}

export class RuntimeError extends PError {
  public constructor(message: string, token: Token) {
    super(RuntimeError.name, message, token.locationSpan.start.line, token.locationSpan.start.column);
  }
}