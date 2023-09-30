import Syntax from "./syntax-type";

const TAB = " ".repeat(2);
export type ValueType = string | number | boolean | undefined;

export class Location {
    public constructor(
        public readonly line: number,
        public readonly column: number
    ) {}

    public toString(): string {
        return `(${this.line}:${this.column})`;
    }
}

export class LocationSpan {
    public constructor(
        public readonly start: Location,
        public readonly finish: Location
    ) {}

    public toString(): string {
        return `${this.start.toString()} - ${this.finish.toString()}`;
    }
}

export class Token<T extends ValueType = ValueType> {
    public constructor(
        public readonly syntax: Syntax,
        public readonly lexeme: string,
        public readonly value: T,
        public readonly locationSpan: LocationSpan
    ) {}

    public toString(): string {
        return [
            "Token {",
            `${TAB}syntax: ${Syntax[this.syntax]}`,
            `${TAB}lexeme: "${this.lexeme}"`,
            `${TAB}value: ${this.value}`,
            `${TAB}locationSpan: ${this.locationSpan.toString()}`,
            "}"
        ].join("\n");
    }
}
