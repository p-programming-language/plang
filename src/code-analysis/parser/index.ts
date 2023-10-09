
import { Token } from "../tokenization/token";
import { ParserSyntaxError } from "../../errors";
import { fakeToken } from "../../utility";
import type { TypeLiteralValueType } from "../type-checker";
import type P from "../../../tools/p";
import type TypeAnalyzer from "./type-analyzer";
import TypeParser from "./type-parser";
import Syntax from "../tokenization/syntax-type";
import AST from "./ast";

import * as SyntaxSets from "../tokenization/syntax-sets";
const { UNARY_SYNTAXES, LITERAL_SYNTAXES, COMPOUND_ASSIGNMENT_SYNTAXES } = SyntaxSets;

import { LiteralExpression } from "./ast/expressions/literal";
import { StringInterpolationExpression } from "./ast/expressions/string-interpolation";
import { RangeLiteralExpression } from "./ast/expressions/range-literal";
import { ArrayLiteralExpression } from "./ast/expressions/array-literal";
import { ObjectLiteralExpression } from "./ast/expressions/object-literal";
import { ParenthesizedExpression } from "./ast/expressions/parenthesized";
import { UnaryExpression } from "./ast/expressions/unary";
import { BinaryExpression } from "./ast/expressions/binary";
import { TernaryExpression } from "./ast/expressions/ternary";
import { IdentifierExpression } from "./ast/expressions/identifier";
import { VariableAssignmentExpression } from "./ast/expressions/variable-assignment";
import { CompoundAssignmentExpression } from "./ast/expressions/compound-assignment";
import { PropertyAssignmentExpression } from "./ast/expressions/property-assignment";
import { CallExpression } from "./ast/expressions/call";
import { AccessExpression } from "./ast/expressions/access";
import { TypeOfExpression } from "./ast/expressions/typeof";
import { IsExpression } from "./ast/expressions/is";
import { IsInExpression } from "./ast/expressions/is-in";
import { ExpressionStatement } from "./ast/statements/expression";
import { VariableAssignmentStatement } from "./ast/statements/variable-assignment";
import { VariableDeclarationStatement } from "./ast/statements/variable-declaration";
import { BlockStatement } from "./ast/statements/block";
import { IfStatement } from "./ast/statements/if";
import { WhileStatement } from "./ast/statements/while";
import { FunctionDeclarationStatement } from "./ast/statements/function-declaration";
import { ReturnStatement } from "./ast/statements/return";
import { TypeDeclarationStatement } from "./ast/statements/type-declaration";
import { UseStatement } from "./ast/statements/use";
import { BreakStatement } from "./ast/statements/break";
import { NextStatement } from "./ast/statements/next";
import { EveryStatement } from "./ast/statements/every";

const negate = <T, U>(a: T[], b: U[]): T[] =>
  a.filter(item => !b.includes(<any>item));

export interface ParseResult {
  readonly imports: UseStatement[];
  readonly program: AST.Statement[];
}

export class Parser extends TypeParser {
  public constructor(
    tokens: Token[],
    protected readonly typeAnalyzer: TypeAnalyzer,
    private readonly runner: P
  ) { super(tokens); }

  /**
   * Parses until the predicate returns true
   *
   * Predicate returns whether or not the parser is finished by default
   */
  public parse(until = () => this.isFinished): ParseResult {
    const statements: AST.Statement[] = [];
    while (!until())
      statements.push(this.declaration());

    const imports = statements.filter((stmt): stmt is UseStatement => stmt instanceof UseStatement);
    const program = negate(statements, imports);
    return { imports, program };
  }

  /**
   * Parse a non-declaration statement
   */
  private parseStatement(): AST.Statement {
    if (this.match(Syntax.Use))
      return this.parseImport();

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

    if (this.match(Syntax.Every)) {
      const parser = this;
      const keyword = this.previous<undefined>();
      function parseElementDeclaration(): VariableDeclarationStatement {
        const elementType = parser.parseType();
        const elementName = parser.consume<undefined, Syntax.Identifier>(Syntax.Identifier);
        const elementIdentifier = new IdentifierExpression(elementName);
        return new VariableDeclarationStatement(elementType, elementIdentifier, false);
      }

      const elementDeclarations = [ parseElementDeclaration() ];
      while (this.match(Syntax.Comma))
        elementDeclarations.push(parseElementDeclaration());

      this.consume(Syntax.In, "'in'");
      const iterator = this.parseExpression();
      const body = this.parseStatement();
      return new EveryStatement(keyword, elementDeclarations, iterator, body);
    }

    if (this.match(Syntax.Break)) {
      const keyword = this.previous<undefined>();
      return new BreakStatement(keyword);
    }

    if (this.match(Syntax.Next)) {
      const keyword = this.previous<undefined>();
      return new NextStatement(keyword);
    }

    if (this.match(Syntax.Return)) {
      const keyword = this.previous<undefined>();
      const expr = this.checkSet([Syntax.Semicolon, Syntax.RBrace, Syntax.EOF]) ?
        new LiteralExpression(fakeToken<undefined>(Syntax.Undefined, "undefined"))
        : this.parseExpression();

      return new ReturnStatement(keyword, expr);
    }

    if (this.match(Syntax.LBrace))
      return this.parseBlockOrObject();

    return this.parseExpressionStatement();
  }

  /**
   * Parses a declaration statement like a class, variable, function, etc.
   */
  private declaration(): AST.Statement {
    if (this.atVariableDeclaration)
      return this.parseVariableDeclaration();

    if (this.atFunctionDeclaration)
      return this.parseFunctionDeclaration();

    if (this.match(Syntax.Interface)) {
      const declaration = this.parseInterfaceType();
      this.consumeSemicolons();
      return new TypeDeclarationStatement(declaration.name, declaration);
    }

    if (this.match(Syntax.Class)) {
      const declaration = this.parseClassDeclaration();
      this.consumeSemicolons();
      return new TypeDeclarationStatement(declaration.name, declaration);
    }

    if (this.check(Syntax.Identifier) && this.current.lexeme === "type") {
      const [name, aliasedType] = this.parseTypeAlias();
      this.consumeSemicolons();
      return new TypeDeclarationStatement(name, aliasedType);
    }

    const stmt = this.parseStatement();
    this.consumeSemicolons();
    return stmt;
  }

  private get atFunctionDeclaration(): boolean {
    if (this.check(Syntax.Mut))
      return false;

    let offsetToFnKeyword = 0;
    let passedClosingParen = false;
    if (this.checkType() && this.check(Syntax.LParen))
      while (!this.check(Syntax.EOF, offsetToFnKeyword) && !this.check(Syntax.Function, offsetToFnKeyword)) {
        if (this.check(Syntax.RParen, offsetToFnKeyword))
          passedClosingParen = true;

        if (!this.checkType(offsetToFnKeyword) && this.check(Syntax.Identifier, offsetToFnKeyword) && passedClosingParen)
          return false;

        offsetToFnKeyword++;
      }
    else if (!this.checkType() && this.check(Syntax.Identifier))
      return false;

    return this.checkType() && this.check(Syntax.Function, offsetToFnKeyword === 0 ? 1 : offsetToFnKeyword);
  }

  private get atVariableDeclaration(): boolean {
    const isVariableDeclarationSyntax = (offset = 1) =>
      this.checkSet([
        Syntax.Identifier, Syntax.Pipe,
        Syntax.LBracket, Syntax.RBracket,
        Syntax.RParen, Syntax.ColonColon,
        Syntax.Question
      ], offset);

    const soFarSoGood = (this.check(Syntax.Mut) ? this.checkType(1) : this.checkType())
      && !this.checkSet([Syntax.Dot], 1) && !this.checkSet([Syntax.Dot], 2)
      && (isVariableDeclarationSyntax() || isVariableDeclarationSyntax(2));

    if (soFarSoGood) {
      let offset = 1;
      while (!this.check(Syntax.EOF, offset) && (!this.check(Syntax.Equal, offset) || (this.check(Syntax.Identifier, offset) && !this.checkType(offset)))) {
        if (this.checkSet([Syntax.Function, Syntax.Is], offset))
          return false;

        offset++
      }
    }

    return soFarSoGood;
  }

  private parseImportMember(): Token<undefined> {
    let importedSpecifics = false;
    let consumedStar = false;
    const matchedStar = this.match(Syntax.Star) || this.consume(Syntax.Identifier, "import member");
    const token = this.previous<undefined>();
    if (matchedStar === true) {
      if (importedSpecifics)
        throw new ParserSyntaxError("You can import specific members or all members, but not both", token);
      else if (consumedStar)
        throw new ParserSyntaxError(`'*' was imported more than once`, token);

      consumedStar = true;
    }

    return token;
  }

  private parseImportPath(): string {
    let path = "";
    const validFirstTokens = [Syntax.DotDot, Syntax.Dot, Syntax.Identifier];
    if (!this.matchSet(validFirstTokens))
      throw new ParserSyntaxError(`Expected import path, got '${this.current.lexeme}'`, this.current);

    path += this.previous<undefined>().lexeme;
    while (this.match(Syntax.Slash)) {
      path += this.previous<undefined>().lexeme;
      if (!this.matchSet(validFirstTokens))
        break;
      else
        path += this.previous<undefined>().lexeme;
    }

    return path;
  }

  private parseImport(): UseStatement {
    const keyword = this.previous<undefined>();
    this.match(Syntax.LBrace);

    const members = [ this.parseImportMember() ];
    const importAll = members[0].syntax === Syntax.Star;
    if (!importAll)
      while (this.match(Syntax.Comma))
        members.push(this.parseImportMember());

    this.match(Syntax.RBrace);
    this.consume(Syntax.From, "'from'");
    const intrinsic = this.match(Syntax.At);
    const path = this.parseImportPath();

    return new UseStatement(keyword, importAll || members, {
      intrinsic,
      path: intrinsic ? "@" + path : path
    });
  }

  private parseFunctionDeclaration(): AST.Statement {
    const returnType = this.parseType();
    const keyword = this.consume<undefined>(Syntax.Function);

    const identifierToken = this.consume<undefined>(Syntax.Identifier, "identifier");
    const parameters: VariableDeclarationStatement[] = [];
    if (this.match(Syntax.LParen)) {
      if (this.atVariableDeclaration) {
        parameters.push(this.parseVariableDeclaration());
        while (this.match(Syntax.Comma))
          parameters.push(this.parseVariableDeclaration());
      }
      this.consume(Syntax.RParen, "')'");
    }


    this.consume(Syntax.LBrace);
    const body = this.parseBlock();
    const declaration = new FunctionDeclarationStatement(keyword, identifierToken, returnType, parameters, body);
    this.consumeSemicolons();
    return declaration;
  }

  private parseVariableDeclaration(): VariableDeclarationStatement {
    const isMutable = this.match(Syntax.Mut);
    const type = this.parseType();
    const identifierToken = this.consume<undefined, Syntax.Identifier>(Syntax.Identifier, "identifier");
    const initializer = this.match(Syntax.Equal) ?
      this.parseExpression()
      : undefined;

    const identifier = new IdentifierExpression(identifierToken);
    const declaration = new VariableDeclarationStatement(type, identifier, isMutable, initializer);
    this.consumeSemicolons();
    return declaration;
  }

  private parseBlock(): BlockStatement {
    const brace = this.previous<undefined>();
    this.typeAnalyzer!.typeTracker.beginTypeScope();
    const result = this.parse(() => this.match(Syntax.RBrace));
    this.typeAnalyzer!.typeTracker.endTypeScope();
    return new BlockStatement(brace, result.program);
  }

  /**
   * Wraps an expression in a statement, acts as a singular expression
   */
  private parseExpressionStatement(): AST.Statement {
    const expr = this.parseExpression();
    this.consumeSemicolons();
    return expr instanceof AST.Expression ?
      new ExpressionStatement(expr)
      : expr;
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
        throw new ParserSyntaxError("Invalid assignment target", this.current);

      if (left instanceof IdentifierExpression)
        return isStatement ?
          new VariableAssignmentStatement(left, value)
          : new VariableAssignmentExpression(left, value);
      else if (left instanceof AccessExpression)
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
        throw new ParserSyntaxError("Invalid compound assignment target", this.current);

      left = new CompoundAssignmentExpression(<IdentifierExpression | AccessExpression>left, right, operator);
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

    while (this.match(Syntax.EqualEqual, Syntax.BangEqual, Syntax.Is)) {
      const operator = this.previous<undefined>();
      if (operator.syntax === Syntax.Is) {
        const inversed = this.match(Syntax.Bang);
        if (this.match(Syntax.In)) {
          const object = this.parseExpression();
          left = new IsInExpression(left, object, inversed, operator);
        } else {
          const typeRef = this.parseType();
          left = new IsExpression(left, typeRef, inversed, operator)
        }
      } else {
        const right = this.parseBitwiseOr();
        left = new BinaryExpression(left, right, operator);
      }
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

    while (this.match(Syntax.Carat, Syntax.StarStar, Syntax.DotDot)) {
      const operator = this.previous<undefined>();
      const right = this.parseUnary();
      left = operator.syntax === Syntax.DotDot ?
        new RangeLiteralExpression(left, right, operator)
        : new BinaryExpression(left, right, operator);
    }

    return left;
  }

  private parseUnary(): AST.Expression {
    if (this.matchSet(UNARY_SYNTAXES)) {
      const operator = this.previous<undefined>();
      const operand = this.parseCall();
      if (operator.syntax === Syntax.TypeOf)
        return new TypeOfExpression(operator, operand);

      if ((operator.syntax === Syntax.PlusPlus || operator.syntax === Syntax.MinusMinus) && !this.isAssignmentTarget(operand))
        throw new ParserSyntaxError("Invalid increment/decrement target", operand.token);

      return new UnaryExpression(operator, operand);
    } else
      return this.parseCall();
  }

  private parseCall(): AST.Expression {
    let callee = this.parseAccess();

    while (this.match(Syntax.LParen)) {
      const args = this.parseExpressionList(Syntax.RParen);
      this.consume(Syntax.RParen, "')'");
      callee = new CallExpression(callee, args);
    }

    return callee;
  }

  private parseAccess(): AST.Expression {
    let object = this.parseIndex();

    while (this.match(Syntax.Dot)) {
      const accessToken = this.previous<undefined>();
      const indexIdentifier = this.consume<string>(Syntax.Identifier);
      indexIdentifier.syntax = Syntax.String;
      indexIdentifier.value = indexIdentifier.lexeme;
      indexIdentifier.lexeme = `"${indexIdentifier.lexeme}"`;

      const index = new LiteralExpression(indexIdentifier);
      object = new AccessExpression(accessToken, object, index);
    }

    return object;
  }

  private parseIndex(): AST.Expression {
    let object = this.parsePrimary();

    while (this.check(Syntax.LBracket)) {
      this.consume(Syntax.LBracket);
      if (!this.checkSet([Syntax.RBracket, Syntax.RBrace, Syntax.RParen, Syntax.Identifier], -2))
        continue;

      const bracket = this.previous<undefined>();
      const index = this.parseExpression();
      this.consume(Syntax.RBracket, "']'");
      object = new AccessExpression(bracket, object, index);
    }

    return object;
  }

  /**
   * Parse a primary value, such as a literal or groupings
   */
  private parsePrimary(): AST.Expression {
    if (this.match(Syntax.LParen)) {
      const expr = this.parseExpression();
      this.consume(Syntax.RParen, "')'");
      return new ParenthesizedExpression(expr);
    }

    if (this.matchSet(LITERAL_SYNTAXES)) {
      const token = this.previous<TypeLiteralValueType | null | undefined>();
      if (this.checkSet(LITERAL_SYNTAXES, -2)) {
        let message = "Unexpected ";
        switch(token.syntax) {
          case Syntax.Float:
          case Syntax.Int: {
            message += "number";
            break;
          }
          case Syntax.String: {
            message += "string";
            break;
          }
          case Syntax.Boolean: {
            message += "boolean";
            break;
          }
          default: {
            message += "literal";
            break;
          }
        }

        throw new ParserSyntaxError(message, token);
      }

      return token.syntax === Syntax.String && token.lexeme.includes("%{") ?
        this.parseStringInterpolation(<Token<string, Syntax.String>>token)
        : new LiteralExpression(token);
    }

    if (this.match(Syntax.LBrace)) {
      const brace = this.previous<undefined>();
      if (this.match(Syntax.RBrace))
        return new ObjectLiteralExpression(brace, new Map);

      return this.parseObjectContents(brace);
    }

    if (this.match(Syntax.LBracket)) {
      const bracket = this.previous<undefined>();
      const elements = this.parseExpressionList(Syntax.RBracket);
      this.consume(Syntax.RBracket, "']'");
      return new ArrayLiteralExpression(bracket, elements);
    }

    if (this.match(Syntax.Identifier))
      return new IdentifierExpression(this.previous());

    throw new ParserSyntaxError(`Expected expression, got '${this.current.syntax === Syntax.EOF ? "EOF" : this.current.lexeme}'`, this.current);
  }

  private parseBlockOrObject(): AST.Statement {
    const brace = this.previous<undefined>();
    if (this.match(Syntax.RBrace))
      return new ExpressionStatement(new ObjectLiteralExpression(brace, new Map));

    if (this.check(Syntax.Identifier) && this.check(Syntax.Colon, 1))
      return new ExpressionStatement(this.parseObjectContents(brace));
    else if (this.check(Syntax.LBracket)) {
      let offset = 1;
      while (!this.check(Syntax.RBracket, offset))
        ++offset;

      if (this.check(Syntax.Colon, offset + 1))
        return new ExpressionStatement(this.parseObjectContents(brace));
    }

    return this.parseBlock();
  }

  /**
   * Parse the contents of an object, as well as the final right brace
   * @param brace The left brace token
   */
  private parseObjectContents(brace: Token<undefined, Syntax>): ObjectLiteralExpression {
    const keyValuePairs = [ this.parseObjectKeyValuePair() ];
    while (this.match(Syntax.Comma) && !this.check(Syntax.RBrace))
      keyValuePairs.push(this.parseObjectKeyValuePair());

    this.consume(Syntax.RBrace, "'}'");
    return new ObjectLiteralExpression(brace, new Map(keyValuePairs));
  }

  private parseObjectKeyValuePair(): [AST.Expression, AST.Expression] {
    let key;
    if (this.match(Syntax.Identifier)) {
      const identifier = this.previous<undefined, Syntax.Identifier>();
      key = new LiteralExpression(fakeToken(Syntax.String, `"${identifier.lexeme}"`, identifier.lexeme));
    } else {
      this.consume(Syntax.LBracket, "'['");
      key = this.parseExpression();
      this.consume(Syntax.RBracket, "']'");
    }

    this.consume(Syntax.Colon, "':'");
    const value = this.parseExpression();
    return [key, value];
  }

  private parseStringInterpolation(string: Token<string, Syntax.String>): StringInterpolationExpression {
    const rawParts = this.extractInterpolationParts(string.value);
    const parts: (LiteralExpression<string> | AST.Expression)[] = [];

    for (const part of rawParts) {
      if (part.startsWith("%{")) {
        const interpolationParser =  this.runner.createParser(part.slice(2, -1));
        const expression = interpolationParser.parseExpression();
        parts.push(expression);
      } else
        parts.push(new LiteralExpression(fakeToken(Syntax.String, `"${part}"`, part)));
    }

    return new StringInterpolationExpression(parts);
  }

  private extractInterpolationParts(string: string): string[] {
    const rawParts: string[] = [];
    const pattern = /%\{([^{}]+)\}/;
    const match = string.match(pattern);

    if (match !== null) {
      rawParts.push(match.input!.slice(0, match.index!));
      rawParts.push(match[0]);

      if (pattern.test(match.input!.slice(match.index! + match[0].length))) {
        rawParts.push(...this.extractInterpolationParts(match.input!.slice(match.index! + match[0].length)));
      } else {
        rawParts.push(match.input!.slice(match.index! + match[0].length));
      }
    }

    return rawParts;
  }

  /**
   * @returns Whether or not `operand` can be a target of an assignment expression
   */
  private isAssignmentTarget(operand: AST.Expression): boolean {
    return operand instanceof IdentifierExpression
      || operand instanceof AccessExpression;
  }

  /**
   * Parses a list of expressions separated by commas
   */
  private parseExpressionList(closer?: Syntax): AST.Expression[] {
    if (closer && this.check(closer))
      return [];

    const expressions = [ this.parseExpression() ];
    while (this.match(Syntax.Comma) && (closer !== undefined ? !this.check(closer) : true))
      expressions.push(this.parseExpression());

    return expressions;
  }
}