import assert from "assert";

import { Token } from "../syntax/token";
import { ParsingError } from "../../errors";
import { LiteralExpression } from "./ast/expressions/literal";
import { ParenthesizedExpression } from "./ast/expressions/parenthesized";

import ArrayStepper from "../array-stepper";
import Lexer from "../syntax/lexer";
import Syntax from "../syntax/syntax-type";
import AST from "./ast";
import { BinaryExpression } from "./ast/expressions/binary";
import { UnaryExpression } from "./ast/expressions/unary";

const LITERAL_SYNTAXES = [Syntax.BOOLEAN, Syntax.STRING, Syntax.FLOAT, Syntax.INT, Syntax.NULL, Syntax.UNDEFINED];
const UNARY_SYNTAXES = [Syntax.PLUS_PLUS, Syntax.MINUS_MINUS, Syntax.PLUS, Syntax.MINUS, Syntax.BANG, Syntax.HASHTAG];

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
    return this.parseAdditive();
  }

  private parseUnary(): AST.Expression {
    if (UNARY_SYNTAXES.includes(this.current.syntax)) {
      const operator = this.advance();
      const operand = this.parseExpression();
      return new UnaryExpression(operator, operand);
    } else
      return this.parsePrimary();
  }

  private parseExponential(): AST.Expression {
    let left = this.parseUnary();

    while (this.match(Syntax.CARAT)) { // this is also where i parsed ".." in cosmo, AKA a range literal expression
      const operator = this.previous();
      const right = this.parseUnary();
      left = new BinaryExpression(left, right, operator);
    }

    return left;
  }

  private parseMultiplicative(): AST.Expression {
    let left = this.parseExponential();

    while (this.match(Syntax.STAR) || this.match(Syntax.SLASH) || this.match(Syntax.SLASH_SLASH) || this.match(Syntax.PERCENT)) {
      const operator = this.previous();
      const right = this.parseExponential();
      left = new BinaryExpression(left, right, operator);
    }

    return left;
  }

  private parseAdditive(): AST.Expression {
    let left = this.parseMultiplicative();

    while (this.match(Syntax.PLUS) || this.match(Syntax.MINUS)) {
      const operator = this.previous();
      const right = this.parseMultiplicative();
      left = new BinaryExpression(left, right, operator);
    }

    return left;
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

  private previous(): Token {
    return this.peek(-1)!;
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