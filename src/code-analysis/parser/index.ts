
import { Token } from "../syntax/token";
import { ParsingError } from "../../errors";
import { ValueType } from "../type-checker";
import { fakeToken } from "../../utility";
import ArrayStepper from "../array-stepper";
import Lexer from "../syntax/lexer";
import Syntax from "../syntax/syntax-type";
import * as SyntaxSets from "../syntax/syntax-sets";
import AST from "./ast";

import { LiteralExpression } from "./ast/expressions/literal";
import { ParenthesizedExpression } from "./ast/expressions/parenthesized";
import { UnaryExpression } from "./ast/expressions/unary";
import { BinaryExpression } from "./ast/expressions/binary";
import { TernaryExpression } from "./ast/expressions/ternary";
import { IdentifierExpression } from "./ast/expressions/identifier";
import { VariableAssignmentExpression } from "./ast/expressions/variable-assignment";
import { CompoundAssignmentExpression } from "./ast/expressions/compound-assignment";
import { SingularTypeExpression } from "./ast/type-nodes/singular-type";
import { UnionTypeExpression } from "./ast/type-nodes/union-type";
import { CallExpression } from "./ast/expressions/call";
import { IndexExpression } from "./ast/expressions";
import { ExpressionStatement } from "./ast/statements/expression";
import { VariableAssignmentStatement } from "./ast/statements/variable-assignment";
import { VariableDeclarationStatement } from "./ast/statements/variable-declaration";
import { ArrayLiteralExpression } from "./ast/expressions/array-literal";
import { ArrayTypeExpression } from "./ast/type-nodes/array-type";
import { BlockStatement } from "./ast/statements/block";
import { PrintlnStatement } from "./ast/statements/println";
import { IfStatement } from "./ast/statements/if";
import { WhileStatement } from "./ast/statements/while";
import { PropertyAssignmentExpression } from "./ast/expressions/property-assignment";
const { UNARY_SYNTAXES, LITERAL_SYNTAXES, COMPOUND_ASSIGNMENT_SYNTAXES } = SyntaxSets;

type SyntaxSet = (typeof SyntaxSets)[keyof typeof SyntaxSets];

export default class Parser extends ArrayStepper<Token> {
  private readonly typeScopes: string[][] = [
    ["int", "float", "string", "bool", "undefined", "null", "void", "any", "Array"]
  ];

  public constructor(source: string) {
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    super(tokens);
  }

  public parse(until: () => boolean = () => this.isFinished): AST.Statement[] {
    const statements = [];
    while (!until()) {
      const stmt = this.declaration();
      statements.push(stmt);
    }
    return statements;
  }

  private parseStatement(): AST.Statement {
    if (this.match(Syntax.Println)) {
      const keyword = this.previous<undefined>();
      const expressions = this.parseExpressionList();
      return new PrintlnStatement(keyword, expressions);
    }

    if (this.match(Syntax.If, Syntax.Unless)) {
      const keyword = this.previous<undefined>();
      const condition = this.parseExpression();
      const body = this.parseStatement();
      const elseBranch = this.match(Syntax.Else) ? this.parseStatement() : undefined;
      return new IfStatement(keyword, condition, body, elseBranch);
    }

    if (this.match(Syntax.While, Syntax.Until)) {
      const keyword = this.previous<undefined>();
      const condition = this.parseExpression();
      const body = this.parseStatement();
      return new WhileStatement(keyword, condition, body);
    }

    if (this.match(Syntax.LBrace))
      return this.parseBlock();

    return this.parseExpressionStatement();
  }

  private parseTypeList(): AST.TypeRef[] {
    const types = [ this.parseType() ];
    while (this.match(Syntax.Comma))
      types.push(this.parseType());

    return types;
  }

  private parseExpressionList(): AST.Expression[] {
    const expressions = [ this.parseExpression() ];
    while (this.match(Syntax.Comma))
      expressions.push(this.parseExpression());

    return expressions;
  }

  private parseBlock(): BlockStatement {
    const brace = this.previous<undefined>();
    this.typeScopes.push([]);
    const statements = this.parse(() => this.match(Syntax.RBrace));
    this.typeScopes.pop();
    return new BlockStatement(brace, statements);
  }

  // parse declarations like classes, variables, functions, etc.
  private declaration(): AST.Statement {
    const nextSyntax = this.peek()?.syntax;
    const nextNextSyntax = this.peek(2)?.syntax;
    const isVariableDeclarationSyntax = (syntax?: Syntax) => syntax === Syntax.Identifier
      || syntax === Syntax.Pipe
      || syntax === Syntax.LBracket;


    if ((this.match(Syntax.Mut) ? this.checkType() : this.checkType()) && (isVariableDeclarationSyntax(nextSyntax) || isVariableDeclarationSyntax(nextNextSyntax))) {
      const declaration = this.parseVariableDeclaration();
      this.consumeSemicolons();
      return declaration;
    }

    const stmt = this.parseStatement();
    this.consumeSemicolons();
    return stmt;
  }

  private parseVariableDeclaration(): AST.Statement {
    const isMutable = this.check(Syntax.Mut, -1);
    const type = this.parseType();
    const identifierToken = this.consume<undefined>(Syntax.Identifier, "identifier");
    const initializer = this.match(Syntax.Equal) ?
      this.parseExpression()
      : undefined;

    const identifier = new IdentifierExpression(identifierToken);
    return new VariableDeclarationStatement(type, identifier, isMutable, initializer);
  }

  private parseExpressionStatement(): AST.Statement {
    const expr = this.parseExpression();
    this.consumeSemicolons();
    return expr instanceof AST.Expression ?
      new ExpressionStatement(expr)
      : expr;
  }

  private consumeSemicolons(): void {
    while (this.match(Syntax.Semicolon));
  }

  private parseExpression(): AST.Expression {
    return <AST.Expression>this.parseTernary();
  }

  private parseTernary(): AST.Expression | AST.Statement {
    let left = this.parseVariableAssignment();

    while (this.match(Syntax.Question)) {
      const operator = this.previous<undefined>();
      const body = this.parseExpression();
      this.consume(Syntax.Colon, "':'");
      const elseBranch = this.parseExpression();
      left = new TernaryExpression(operator, <AST.Expression>left, body, elseBranch);
    }

    return left;
  }

  private parseVariableAssignment(): AST.Expression | AST.Statement {
    let left = this.parseCompoundAssignment();

    if (this.match(Syntax.Equal, Syntax.ColonEqual)) {
      const isStatement = this.check(Syntax.Equal, -1);
      const value = <AST.Expression>this.parseExpression();

      if (!this.isAssignmentTarget(left))
        throw new ParsingError("Invalid assignment target", this.current);

      if (left instanceof IdentifierExpression)
        return isStatement ?
          new VariableAssignmentStatement(left, value)
          : new VariableAssignmentExpression(left, value);
      else if (left instanceof IndexExpression)
        return new PropertyAssignmentExpression(left, value);
    }

    return left;
  }

  private parseCompoundAssignment(): AST.Expression {
    let left = this.parseLogicalOr();

    if (this.matchSet(COMPOUND_ASSIGNMENT_SYNTAXES)) {
      const operator = this.previous<undefined>();
      const right = this.parseIndex();
      if (!this.isAssignmentTarget(left))
        throw new ParsingError("Invalid compound assignment target", this.current);

      left = new CompoundAssignmentExpression(<IdentifierExpression | IndexExpression>left, right, operator);
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
    let left = this.parseIndex();

    while (this.match(Syntax.Carat, Syntax.StarStar)) { // this is also where i parsed ".." in cosmo, AKA a range literal expression
      const operator = this.previous<undefined>();
      const right = this.parseIndex();
      left = new BinaryExpression(left, right, operator);
    }

    return left;
  }

  private parseIndex(): AST.Expression {
    let object = this.parseCall();

    while (this.match(Syntax.LBracket)) {
      const bracket = this.previous<undefined>();
      const index = this.parseExpression();
      this.consume(Syntax.RBracket, "']'");
      object = new IndexExpression(bracket, <AST.Expression>object, index);
    }

    return object;
  }

  private parseCall(): AST.Expression {
    let callee = this.parseUnary();

    while (this.match(Syntax.LParen)) {
      let args: AST.Expression[] = [];
      if (!this.check(Syntax.RParen))
        args = this.parseExpressionList();

      this.consume(Syntax.RParen, "')'");
      callee = new CallExpression(<AST.Expression>callee, args);
    }

    return callee;
  }

  private parseUnary(): AST.Expression {
    if (this.matchSet(UNARY_SYNTAXES)) {
      const operator = this.previous<undefined>();
      const operand = this.parseUnary();
      if (!this.isAssignmentTarget(operand) && (operator.syntax === Syntax.PlusPlus || operator.syntax === Syntax.MinusMinus))
        throw new ParsingError("Invalid increment/decrement target", operand.token);

      return new UnaryExpression(operator, operand);
    } else
      return this.parsePrimary();
  }

  private isAssignmentTarget(operand: AST.Expression): boolean {
    return operand instanceof IdentifierExpression
      || operand instanceof IndexExpression;
  }

  private parsePrimary(): AST.Expression {
    if (this.matchSet(LITERAL_SYNTAXES))
      return new LiteralExpression(this.previous());
    if (this.match(Syntax.LBracket)) {
      const bracket = this.previous<undefined>();
      const elements = this.parseExpressionList();
      this.consume(Syntax.RBracket, "']'");
      return new ArrayLiteralExpression(bracket, elements);
    }

    if (this.match(Syntax.Identifier))
      return new IdentifierExpression(this.previous());
    if (this.match(Syntax.LParen)) {
      const expr = this.parseExpression();
      this.consume(Syntax.RParen, "')'");
      return new ParenthesizedExpression(expr);
    }

    throw new ParsingError("Expected expression", this.current);
  }

  private parseType(): AST.TypeRef {
    return this.parseUnionType();
  }

  private parseUnionType(): AST.TypeRef {
    let left = this.parseArrayType();

    while (this.match(Syntax.Pipe)) {
      const singularTypes: (SingularTypeExpression | ArrayTypeExpression)[] = [];
      if (left instanceof UnionTypeExpression)
        singularTypes.push(...left.types);
      else if (left instanceof SingularTypeExpression || left instanceof ArrayTypeExpression)
        singularTypes.push(left);

      singularTypes.push(this.parseSingularType());
      left = new UnionTypeExpression(singularTypes);
    }

    return left;
  }

  private parseArrayType(): AST.TypeRef {
    let left: AST.TypeRef = this.parseSingularType();

    while (this.match(Syntax.LBracket)) {
      this.consume(Syntax.RBracket, "']'");
      left = new ArrayTypeExpression(left);
    }

    if (this.match(Syntax.Question))
      left = new UnionTypeExpression([
        <SingularTypeExpression>left,
        new SingularTypeExpression(fakeToken(Syntax.Undefined, "undefined"))
      ]);

    return left;
  }

  private parseSingularType(): SingularTypeExpression {
    if (!this.checkType())
      throw new ParsingError(`Expected type, got '${this.current.lexeme}'`, this.current);

    const typeKeyword = this.advance<undefined>();
    let typeArgs: AST.TypeRef[] | undefined;
    if (this.match(Syntax.LT)) {
      typeArgs = this.parseTypeList();
      this.consume(Syntax.GT, "'>'");
    }

    return new SingularTypeExpression(typeKeyword, typeArgs);
  }

  private advance<V extends ValueType = ValueType>(): Token<V> {
    const token = this.current;
    if (!this.isFinished)
      this.position++;

    return <Token<V>>token;
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

  private checkType(): boolean {
    return this.checkMultiple(Syntax.Identifier, Syntax.Undefined, Syntax.Null) && this.isTypeDefined(this.current.lexeme);
  }

  private isTypeDefined(name: string): boolean {
    for (let i = this.typeScopes.length - 1; i >= 0; i--)
      if (this.typeScopes[i].includes(name))
        return true;

    return false;
  }

  private checkMultiple(...syntaxes: Syntax[]): boolean {
    for (const syntax of syntaxes)
      if (this.check(syntax))
        return true;

    return false;
  }

  private check(syntax: Syntax, offset = 0): boolean {
    return this.peek(offset)?.syntax === syntax;
  }

  private consume<V extends ValueType = ValueType>(syntax: Syntax, expectedOverride?: string): Token<V> {
    const gotSyntax = this.current ? Syntax[this.current.syntax] : "EOF";
    if (!this.match(syntax))
      throw new ParsingError(`Expected ${expectedOverride ?? `'${Syntax[syntax]}'`}, got ${gotSyntax}`, this.current);

    return this.previous();
  }

  protected override get isFinished(): boolean {
    return this.check(Syntax.EOF);
  }
}