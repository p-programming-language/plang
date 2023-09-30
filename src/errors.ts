export class TokenizationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "TokenizationError";
    }
}