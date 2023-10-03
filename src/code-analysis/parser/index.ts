import assert from "assert";

import { Token } from "../syntax/token";
import { ParsingError } from "../../errors";
import { LiteralExpression } from "./ast/expressions/literal";
import { ParenthesizedExpression } from "./ast/expressions/parenthesized";
import { BinaryExpression } from "./ast/expressions/binary";
import { UnaryExpression } from "./ast/expressions/unary";
import { IdentifierExpression } from "./ast/expressions/identifier";
import { CompoundAssignmentExpression } from "./ast/expressions/compound-assignment";

import ArrayStepper from "../array-stepper";
import Lexer from "../syntax/lexer";
import Syntax from "../syntax/syntax-type";
import AST from "./ast";

import * as SyntaxSets from "../syntax/syntax-sets";
import { ExpressionStatement } from "./ast/statements/expression";
import { VariableAssignmentExpression } from "./ast/expressions/variable-assignment";
import { VariableAssignmentStatement } from "./ast/statements/variable-assignment";
const { UNARY_SYNTAXES, LITERAL_SYNTAXES, TYPE_SYNTAXES, COMPOUND_ASSIGNMENT_SYNTAXES } = SyntaxSets;

export default class Parser extends ArrayStepper<Token> {
  public constructor(source: string) {
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    super(tokens);
  }

  public parse(): AST.Statement[] {
    const statements = [];
    while (!this.isFinished) {
      const stmt = this.declaration();
      if (!stmt) continue;
      statements.push(stmt);
    }
    return statements;
  }

  private declaration(): AST.Statement | undefined {
    try {
      // if (this.currentType)
      //   return this.parseVariableDeclaration();

      return this.parseStatement();
    } catch(e) {
      this.synchronize();
    }
  }

  private parseStatement(): AST.Statement {
    // match other statements like if, return, while, etc
    return this.parseExpressionStatement();
  }

  private parseExpressionStatement(): AST.Statement {
    const expr = this.parseExpression();
    return expr instanceof AST.Expression ?
      new ExpressionStatement(expr)
      : expr;
  }

  private parseExpression(): AST.Expression {
    return <AST.Expression>this.parseVariableAssignment();
  }

  private parseVariableAssignment(): AST.Expression | AST.Statement {
    let left = this.parseCompoundAssignment();

    if (this.match(Syntax.Equal) || this.match(Syntax.ColonEqual)) {
      const operator = this.previous();
      const value = <AST.Expression>this.parseVariableAssignment();
      if (left instanceof IdentifierExpression)
        if (operator.syntax === Syntax.Equal)
          return new VariableAssignmentStatement(left, value);
        else
          return new VariableAssignmentExpression(left, value);

      throw new ParsingError("Invalid assignment target");
    }

    return left;
  }

  private parseCompoundAssignment(): AST.Expression {
    let left = this.parseLogicalOr();

    if (this.matchSet(COMPOUND_ASSIGNMENT_SYNTAXES)) {
      const operator = this.previous();
      const right = this.parseLogicalOr();
      if (!(left instanceof IdentifierExpression)) // || left instanceof AccessExpression
        throw new ParsingError("Invalid compound assignment target");

      left = new CompoundAssignmentExpression(left, right, operator);
    }

    return left;
  }

  private parseLogicalOr(): AST.Expression {
    let left = this.parseLogicalAnd();

    while (this.match(Syntax.PipePipe)) {
      const operator = this.previous();
      const right = this.parseLogicalAnd();
      left = new BinaryExpression(left, right, operator);
    }

    return left;
  }

  private parseLogicalAnd(): AST.Expression {
    let left = this.parseComparison();

    while (this.match(Syntax.AmpersandAmpersand)) {
      const operator = this.previous();
      const right = this.parseComparison();
      left = new BinaryExpression(left, right, operator);
    }

    return left;
  }

  private parseComparison(): AST.Expression {
    let left = this.parseEquality();

    while (this.matchSet([Syntax.LT, Syntax.LTE, Syntax.GT, Syntax.GTE])) {
      const operator = this.previous();
      const right = this.parseEquality();
      left = new BinaryExpression(left, right, operator);
    }

    return left;
  }

  private parseEquality(): AST.Expression {
    let left = this.parseBitwiseOr();

    while (this.matchSet([Syntax.EqualEqual, Syntax.BangEqual])) {
      const operator = this.previous();
      const right = this.parseBitwiseOr();
      left = new BinaryExpression(left, right, operator);
    }

    return left;
  }

  private parseBitwiseOr(): AST.Expression {
    let left = this.parseBitwiseAnd();

    while (this.match(Syntax.Pipe)) {
      const operator = this.previous();
      const right = this.parseBitwiseAnd();
      left = new BinaryExpression(left, right, operator);
    }

    return left;
  }

  private parseBitwiseAnd(): AST.Expression {
    let left = this.parseShift();

    while (this.match(Syntax.Ampersand)) {
      const operator = this.previous();
      const right = this.parseShift();
      left = new BinaryExpression(left, right, operator);
    }

    return left;
  }

  private parseShift(): AST.Expression {
    let left = this.parseAdditive();

    while (this.match(Syntax.LDoubleArrow) || this.match(Syntax.RDoubleArrow)) {
      const operator = this.previous();
      const right = this.parseAdditive();
      left = new BinaryExpression(left, right, operator);
    }

    return left;
  }

  private parseAdditive(): AST.Expression {
    let left = this.parseMultiplicative();

    while (this.match(Syntax.Plus) || this.match(Syntax.Minus)) {
      const operator = this.previous();
      const right = this.parseMultiplicative();
      left = new BinaryExpression(left, right, operator);
    }

    return left;
  }

  private parseMultiplicative(): AST.Expression {
    let left = this.parseExponential();

    while (this.match(Syntax.Star) || this.match(Syntax.Slash) || this.match(Syntax.SlashSlash) || this.match(Syntax.Percent)) {
      const operator = this.previous();
      const right = this.parseExponential();
      left = new BinaryExpression(left, right, operator);
    }

    return left;
  }

  private parseExponential(): AST.Expression {
    let left = this.parseUnary();

    while (this.match(Syntax.Carat)) { // this is also where i parsed ".." in cosmo, AKA a range literal expression
      const operator = this.previous();
      const right = this.parseUnary();
      left = new BinaryExpression(left, right, operator);
    }

    return left;
  }

  private parseUnary(): AST.Expression {
    if (this.matchSet(UNARY_SYNTAXES)) {
      const operator = this.previous();
      const operand = this.parseExpression();
      return new UnaryExpression(operator, operand);
    } else
      return this.parsePrimary();
  }

  private parsePrimary(): AST.Expression {
    if (this.matchSet(LITERAL_SYNTAXES))
      return new LiteralExpression(this.previous());
    if (this.match(Syntax.Identifier))
      return new IdentifierExpression(this.previous());
    if (this.match(Syntax.LParen)) {
      const expr = this.parseExpression();
      this.consume(Syntax.RParen, ")");
      return new ParenthesizedExpression(expr);
    }

    throw new ParsingError("Expected expression");
  }

  private parseType(): void {
    if (this.currentType) return;
    throw new ParsingError(`Expected type, got '${this.current.lexeme}'`);
  }

  private get currentType(): Token | undefined {
    if (!this.matchSet(TYPE_SYNTAXES)) return;
    return this.previous();
  }

  private synchronize(): void {
    this.advance();

    while (!this.isFinished) {
      // if (this.previous().syntax === Syntax.Semicolon)
      //   return;

      if (TYPE_SYNTAXES.includes(this.current.syntax))
        return;

      switch (this.current.syntax) {

      }

      this.advance();
    }
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