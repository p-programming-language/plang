import Syntax from "./syntax-type";


export default interface Token {
    syntax: Syntax;
    lexeme: string;
    value: any;
}
