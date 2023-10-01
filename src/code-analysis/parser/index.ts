import assert from "assert";

import { Token } from "../syntax/token";
import { ParsingError } from "../../errors";
import { Lexer } from "../syntax/lexer";
import { LiteralExpression } from "./ast/expressions/literal";
import { ParenthesizedExpression } from "./ast/expressions/parenthesized";

import ArrayStepper from "../array-stepper";
import Syntax from "../syntax/syntax-type";
import AST from "./ast";

const LITERAL_SYNTAXES = [Syntax.BOOLEAN, Syntax.STRING, Syntax.FLOAT, Syntax.INT, Syntax.NULL, Syntax.UNDEFINED];

export default class Parser extends ArrayStepper<Token> {
  public constructor(source: string) {
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    super(tokens);
  }

  public parse(): AST.Node {
    return this.parseExpression();
  }

  private parseExpression(): AST.Expression {
    return this.parsePrimary();
  }

  private parsePrimary(): AST.Expression {
    if (LITERAL_SYNTAXES.includes(this.current.syntax))
      return new LiteralExpression(this.advance());
    if (this.match(Syntax.LPAREN)) {
      const expr = this.parseExpression();
      this.consume(Syntax.RPAREN, ")");
      return new ParenthesizedExpression(expr);
    }

    throw new ParsingError("Expected expression");
  }

  private advance(): Token {
    const token = this.current;
    if (!this.isFinished)
      this.position++;

    return token;
  }

  private match(...syntaxes: Syntax[]): boolean {
    for (const syntax of syntaxes)
      if (this.check(syntax)) {
        this.advance();
        return true;
      }

    return false;
  }

  private check(syntax: Syntax) {
    return this.current.syntax === syntax;
  }

  private consume(syntax: Syntax, expectedOverride?: string): void {
    const gotSyntax = this.peek() ? Syntax[this.peek()!.syntax] : "undefined";
    const error = new ParsingError(`Expected '${expectedOverride ?? Syntax[syntax]}', got ${gotSyntax}`);
    assert(this.match(syntax), error);
  }

  protected override get isFinished(): boolean {
    return this.current.syntax === Syntax.EOF;
  }
}