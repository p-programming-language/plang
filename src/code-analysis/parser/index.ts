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
import { ValueType } from "../type-checker";
import { VariableDeclarationStatement } from "./ast/statements/variable-declaration";
const { UNARY_SYNTAXES, LITERAL_SYNTAXES, TYPE_SYNTAXES, COMPOUND_ASSIGNMENT_SYNTAXES } = SyntaxSets;

type SyntaxSet = (typeof SyntaxSets)[keyof typeof SyntaxSets];

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
    if (this.currentType && this.peek()?.syntax === Syntax.Identifier)
      return this.parseVariableDeclaration();

    return this.parseStatement();
  }

  private parseVariableDeclaration(): AST.Statement {
    const typeKeyword = this.parseType();
    const identifierToken = this.consume<undefined>(Syntax.Identifier, "identifier");
    const initializer = this.match(Syntax.Equal) ?
      this.parseExpression()
      : undefined;

    const identifier = new IdentifierExpression(identifierToken);
    return new VariableDeclarationStatement(typeKeyword, identifier, initializer);
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

    if (this.match(Syntax.Equal, Syntax.ColonEqual)) {
      const operator = this.previous();
      const value = <AST.Expression>this.parseVariableAssignment();
      if (left instanceof IdentifierExpression)
        if (operator.syntax === Syntax.Equal)
          return new VariableAssignmentStatement(left, value);
        else
          return new VariableAssignmentExpression(left, value);

      throw new ParsingError("Invalid assignment target", this.current);
    }

    return left;
  }

  private parseCompoundAssignment(): AST.Expression {
    let left = this.parseLogicalOr();

    if (this.matchSet(COMPOUND_ASSIGNMENT_SYNTAXES)) {
      const operator = this.previous<undefined>();
      const right = this.parseLogicalOr();
      if (!(left instanceof IdentifierExpression)) // || left instanceof AccessExpression
        throw new ParsingError("Invalid compound assignment target", this.current);

      left = new CompoundAssignmentExpression(left, right, operator);
    }

    return left;
  }

  private parseLogicalOr(): AST.Expression {
    let left = this.parseLogicalAnd();

    while (this.match(Syntax.PipePipe, Syntax.QuestionQuestion)) {
      const operator = this.previous<undefined>();
      const right = this.parseLogicalAnd();
      left = new BinaryExpression(left, right, operator);
    }

    return left;
  }

  private parseLogicalAnd(): AST.Expression {
    let left = this.parseComparison();

    while (this.match(Syntax.AmpersandAmpersand)) {
      const operator = this.previous<undefined>();
      const right = this.parseComparison();
      left = new BinaryExpression(left, right, operator);
    }

    return left;
  }

  private parseComparison(): AST.Expression {
    let left = this.parseEquality();

    while (this.match(Syntax.LT, Syntax.LTE, Syntax.GT, Syntax.GTE)) {
      const operator = this.previous<undefined>();
      const right = this.parseEquality();
      left = new BinaryExpression(left, right, operator);
    }

    return left;
  }

  private parseEquality(): AST.Expression {
    let left = this.parseBitwiseOr();

    while (this.match(Syntax.EqualEqual, Syntax.BangEqual)) {
      const operator = this.previous<undefined>();
      const right = this.parseBitwiseOr();
      left = new BinaryExpression(left, right, operator);
    }

    return left;
  }

  private parseBitwiseOr(): AST.Expression {
    let left = this.parseBitwiseAnd();

    while (this.match(Syntax.Pipe)) {
      const operator = this.previous<undefined>();
      const right = this.parseBitwiseAnd();
      left = new BinaryExpression(left, right, operator);
    }

    return left;
  }

  private parseBitwiseAnd(): AST.Expression {
    let left = this.parseShift();

    while (this.match(Syntax.Ampersand)) {
      const operator = this.previous<undefined>();
      const right = this.parseShift();
      left = new BinaryExpression(left, right, operator);
    }

    return left;
  }

  private parseShift(): AST.Expression {
    let left = this.parseAdditive();

    while (this.match(Syntax.LDoubleArrow, Syntax.RDoubleArrow)) {
      const operator = this.previous<undefined>();
      const right = this.parseAdditive();
      left = new BinaryExpression(left, right, operator);
    }

    return left;
  }

  private parseAdditive(): AST.Expression {
    let left = this.parseMultiplicative();

    while (this.match(Syntax.Plus, Syntax.Minus)) {
      const operator = this.previous<undefined>();
      const right = this.parseMultiplicative();
      left = new BinaryExpression(left, right, operator);
    }

    return left;
  }

  private parseMultiplicative(): AST.Expression {
    let left = this.parseExponential();

    while (this.match(Syntax.Star, Syntax.Slash, Syntax.SlashSlash, Syntax.Percent)) {
      const operator = this.previous<undefined>();
      const right = this.parseExponential();
      left = new BinaryExpression(left, right, operator);
    }

    return left;
  }

  private parseExponential(): AST.Expression {
    let left = this.parseUnary();

    while (this.match(Syntax.Carat)) { // this is also where i parsed ".." in cosmo, AKA a range literal expression
      const operator = this.previous<undefined>();
      const right = this.parseUnary();
      left = new BinaryExpression(left, right, operator);
    }

    return left;
  }

  private parseUnary(): AST.Expression {
    if (this.matchSet(UNARY_SYNTAXES)) {
      const operator = this.previous<undefined>();
      const operand = this.parseUnary();
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
      this.consume(Syntax.RParen, "')'");
      return new ParenthesizedExpression(expr);
    }

    throw new ParsingError("Expected expression", this.current);
  }

  private get currentType(): Token<undefined> | undefined {
    return this.checkSet(TYPE_SYNTAXES) ?
      <Token<undefined>>this.current
      : undefined;
  }

  private parseType(): Token<undefined> {
    if (this.matchSet(TYPE_SYNTAXES))
      return this.previous();

    throw new ParsingError(`Expected type, got '${this.current.lexeme}'`, this.current);
  }

  private advance(): Token {
    const token = this.current;
    if (!this.isFinished)
      this.position++;

    return token;
  }

  private previous<V extends ValueType = ValueType>(): Token<V> {
    return <Token<V>>this.peek(-1)!;
  }

  private matchSet(syntaxSet: SyntaxSet): boolean {
    return this.match(...syntaxSet);
  }

  private match(...syntaxes: Syntax[]): boolean {
    for (const syntax of syntaxes)
      if (this.check(syntax)) {
        this.advance();
        return true;
      }

    return false;
  }

  private checkSet(syntaxSet: SyntaxSet): boolean {
    return syntaxSet.includes(this.current.syntax);
  }

  private check(syntax: Syntax) {
    return this.current.syntax === syntax;
  }

  private consume<V extends ValueType = ValueType>(syntax: Syntax, expectedOverride?: string): Token<V> {
    const gotSyntax = this.current ? Syntax[this.current.syntax] : "EOF";
    if (!this.match(syntax))
      throw new ParsingError(`Expected ${expectedOverride ?? `'${Syntax[syntax]}'`}, got ${gotSyntax}`, this.current);

    return this.previous();
  }

  protected override get isFinished(): boolean {
    return this.current.syntax === Syntax.EOF;
  }
}