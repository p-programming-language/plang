import assert from "assert";

import { Token } from "../syntax/token";
import { ParsingError } from "../../errors";
import { LiteralExpression } from "./ast/expressions/literal";
import { ParenthesizedExpression } from "./ast/expressions/parenthesized";
import { BinaryExpression } from "./ast/expressions/binary";
import { UnaryExpression } from "./ast/expressions/unary";

import ArrayStepper from "../array-stepper";
import Lexer from "../syntax/lexer";
import Syntax from "../syntax/syntax-type";
import AST from "./ast";

import * as SyntaxSets from "../syntax/syntax-sets";
const { UNARY_SYNTAXES, LITERAL_SYNTAXES } = SyntaxSets;


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
    if (this.matchSet(UNARY_SYNTAXES)) {
      const operator = this.previous();
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
    if (this.matchSet(LITERAL_SYNTAXES))
      return new LiteralExpression(this.previous());
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

  private matchSet(syntaxSet: (typeof SyntaxSets)[keyof typeof SyntaxSets]): boolean {
    const matches = syntaxSet.includes(this.current.syntax);
    if (matches)
      this.advance();

    return matches;
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
    const gotSyntax = this.peek() ? Syntax[this.peek()!.syntax] : "EOF";
    const error = new ParsingError(`Expected '${expectedOverride ?? Syntax[syntax]}', got ${gotSyntax}`);
    assert(this.match(syntax), error);
  }

  protected override get isFinished(): boolean {
    return this.current.syntax === Syntax.EOF;
  }
}