export class PError extends Error {
  public constructor(
    public readonly name: string,
    message: string
  ) { super(message); }
}

export class TokenizationError extends PError {
  public constructor(message: string) {
    super(TokenizationError.name, message);
  }
}

export class ParsingError extends PError {
  public constructor(message: string) {
    super(ParsingError.name, message);
  }
}

export class TypeError extends PError {
  public constructor(message: string) {
    super(TypeError.name, message);
  }
}

export class BindingError extends PError {
  public constructor(message: string) {
    super(BindingError.name, message);
  }
}

export class ResolutionError extends PError {
  public constructor(message: string) {
    super(ResolutionError.name, message);
  }
}