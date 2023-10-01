export class TokenizationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "TokenizationError";
    }
}

export class ParsingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ParsingError";
    }
}

export class VariableTypeError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'VariableTypeError';
    }
}
