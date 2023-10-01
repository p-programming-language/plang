import { Token } from "../syntax/token";
import { ParsingError } from "../../errors";
import ArrayStepper from "../array-stepper";
import Syntax from "../syntax/syntax-type";
import AST from "./ast";
import assert from "assert";

export default class Parser extends ArrayStepper<Token> {
    public parse(): AST.Node {

    }

    private match(syntax: Syntax): boolean {
        if (this.peek()?.syntax === syntax) {
            this.position++;
            return true;
        }

        return false;
    }

    private consume(syntax: Syntax): void {
        const gotSyntax = this.peek() ? Syntax[this.peek()!.syntax] : "undefined";
        const error = new ParsingError(`Expected ${Syntax[syntax]}, got ${gotSyntax}`);
        assert(this.match(syntax), error)
    }
}