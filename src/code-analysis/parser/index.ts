
import { Token } from "../tokenization/token";
import { ParserSyntaxError } from "../../errors";
import { fakeToken } from "../../utility";
import type P from "../../../tools/p";
import type TypeAnalyzer from "./type-analyzer";

import { ClassMemberSignature, InterfaceMemberSignature, ModifierType, TypeLiteralValueType, TypeNameSyntax } from "../type-checker";
import TokenStepper from "./token-stepper";
import Syntax from "../tokenization/syntax-type";
import AST from "./ast";

import * as SyntaxSets from "../tokenization/syntax-sets";
const { UNARY_SYNTAXES, LITERAL_SYNTAXES, COMPOUND_ASSIGNMENT_SYNTAXES } = SyntaxSets;

import type { ClassMember } from "./ast/classifications/class-member";

import { SingularTypeExpression } from "./ast/type-nodes/singular-type";
import { LiteralTypeExpression } from "./ast/type-nodes/literal-type";
import { UnionTypeExpression } from "./ast/type-nodes/union-type";
import { ArrayTypeExpression } from "./ast/type-nodes/array-type";
import { FunctionTypeExpression } from "./ast/type-nodes/function-type";
import { InterfaceTypeExpression } from "./ast/type-nodes/interface-type";
import { ClassTypeExpression } from "./ast/type-nodes/class-type";

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
import { NewExpression } from "./ast/expressions/new";
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
import { ClassBodyStatement } from "./ast/statements/class-body";
import { ClassDeclarationStatement } from "./ast/statements/class-declaration";
import { PropertyDeclarationStatement } from "./ast/statements/property-declaration";
import { MethodDeclarationStatement } from "./ast/statements/method-declaration";
import { PackageStatement } from "./ast/statements/package";

const negate = <T, U>(a: T[], b: U[]): T[] =>
  a.filter(item => !b.includes(<any>item));

export interface ParseResult {
  readonly packageDeclaration?: PackageStatement;
  readonly imports: UseStatement[];
  readonly program: AST.Statement[];
}

export class Parser extends TokenStepper {
  public constructor(
    tokens: Token[],
    private readonly runner: P,
    protected typeAnalyzer?: TypeAnalyzer
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
    const packageDeclaration = statements.find((stmt): stmt is PackageStatement => stmt instanceof PackageStatement);
    const program = negate(negate(statements, imports), [packageDeclaration]);
    return { packageDeclaration, imports, program };
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
      const keyword = this.previous<undefined, Syntax.Return>();
      const expr = this.checkSet([Syntax.Semicolon, Syntax.RBrace, Syntax.EOF]) ?
        new LiteralExpression(fakeToken<undefined>(Syntax.Undefined, "undefined"))
        : this.parseExpression();

      return new ReturnStatement(keyword, expr);
    }

    if (this.match(Syntax.Package)) {
      const keyword = this.previous<undefined, Syntax.Package>();
      const name = this.consume<undefined, Syntax.Identifier>(Syntax.Identifier);
      return new PackageStatement(keyword, name);
    }

    if (this.match(Syntax.LBrace))
      return this.parseBlockOrObject();

    return this.parseExpressionStatement();
  }

  /**
   * Parses a declaration statement like a class, variable, function, etc.
   */
  private declaration(): AST.Statement {
    const isPrivate = this.check(Syntax.Private);
    if (this.atVariableDeclaration() || (isPrivate && this.atVariableDeclaration(1))) {
      if (isPrivate)
        this.consume(Syntax.Private);

      const declaration = this.parseVariableDeclaration();
      this.runner.packager.addExport({
        isPrivate, declaration
      });

      return declaration;
    }

    if (this.atFunctionDeclaration() || (isPrivate && this.atFunctionDeclaration(1)))
      return this.parseFunctionDeclaration();

    if (this.check(Syntax.Interface) || (isPrivate && this.check(Syntax.Interface, 1))) {
      if (isPrivate)
        this.consume(Syntax.Private);

      const declaration = this.parseInterfaceType();
      this.consumeSemicolons();
      const typeDeclaration = new TypeDeclarationStatement(declaration.name, declaration);
      this.runner.packager.addExport({
        isPrivate,
        declaration: typeDeclaration
      });

      return typeDeclaration;
    }

    if (this.check(Syntax.Class) || (isPrivate && this.check(Syntax.Class, 1))) {
      if (isPrivate)
        this.consume(Syntax.Private);

      const declaration = this.parseClassDeclaration();
      this.runner.packager.addExport({
        isPrivate, declaration
      });

      this.consumeSemicolons();
      return declaration;
    }

    if ((this.check(Syntax.Identifier) && this.current.lexeme === "type") || (isPrivate && this.check(Syntax.Identifier, 1) && this.peek()?.lexeme === "type")) {
      if (isPrivate)
        this.consume(Syntax.Private);

      const [name, aliasedType] = this.parseTypeAlias();
      const declaration = new TypeDeclarationStatement(name, aliasedType);
      this.runner.packager.addExport({
        isPrivate, declaration
      });

      this.consumeSemicolons();
      return declaration;
    }

    const stmt = this.parseStatement();
    this.consumeSemicolons();
    return stmt;
  }

  private atFunctionDeclaration(offset = 0): boolean {
    if (this.check(Syntax.Mut, offset))
      return false;

    let offsetToFnKeyword = offset;
    let passedClosingParen = false;
    if (this.checkType(offset) && this.check(Syntax.LParen, offset))
      while (!this.check(Syntax.EOF, offsetToFnKeyword) && !this.check(Syntax.Function, offsetToFnKeyword)) {
        if (this.check(Syntax.RParen, offsetToFnKeyword))
          passedClosingParen = true;

        if (!this.checkType(offsetToFnKeyword) && this.check(Syntax.Identifier, offsetToFnKeyword) && passedClosingParen)
          return false;

        offsetToFnKeyword++;
      }
    else if (!this.checkType(offset) && this.check(Syntax.Identifier, offset))
      return false;

    return this.checkType(offset) && this.check(Syntax.Function, offsetToFnKeyword === 0 ? 1 : offsetToFnKeyword);
  }

  private atVariableDeclaration(offset = 0): boolean {
    const isVariableDeclarationSyntax = (o = 1) =>
      this.checkSet([
        Syntax.Identifier, Syntax.Pipe,
        Syntax.LBracket, Syntax.RBracket,
        Syntax.RParen, Syntax.ColonColon
      ], offset + o);

    const soFarSoGood = (this.check(Syntax.Mut, offset) ? this.checkType(offset + 1) : this.checkType(offset))
      && !this.checkSet([Syntax.Dot], offset + 1) && !this.checkSet([Syntax.Dot], offset + 2)
      && (isVariableDeclarationSyntax() || isVariableDeclarationSyntax(2));

    if (soFarSoGood) {
      let o = offset + 1;
      while (!this.check(Syntax.EOF, o) && !this.check(Syntax.RParen, o) && (!this.check(Syntax.Equal, o) || (this.check(Syntax.Identifier, o) && !this.checkType(o)))) {
        if (this.checkSet([Syntax.Function, Syntax.Is], o))
          return false;

        o++
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
    if (!this.match(Syntax.Identifier))
      throw new ParserSyntaxError(`Expected import path, got '${this.current.lexeme}'`, this.current);

    path += this.previous<undefined>().lexeme;
    while (this.match(Syntax.Dot)) {
      path += this.previous<undefined>().lexeme;
      const identifier = this.consume(Syntax.Identifier, "identifier");
      path += identifier.lexeme;
    }

    return path.replace(/\./g, "/");
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
    const keyword = this.consume<undefined, Syntax.Function>(Syntax.Function);

    const identifierToken = this.consume<undefined, Syntax.Identifier>(Syntax.Identifier, "identifier");
    const parameters: VariableDeclarationStatement[] = [];
    if (this.match(Syntax.LParen)) {
      if (this.atVariableDeclaration()) {
        parameters.push(this.parseVariableDeclaration());
        while (this.match(Syntax.Comma))
          parameters.push(this.parseVariableDeclaration());
      }
      this.consume(Syntax.RParen, "')'");
    }


    this.consume(Syntax.LBrace, "'{'");
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
      const right = this.parseLogicalOr();
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
      const operand = this.parsePostfix();
      if (operator.syntax === Syntax.TypeOf)
        return new TypeOfExpression(operator, operand);
      else if (operator.syntax === Syntax.New) {
        if (!(operand instanceof IdentifierExpression))
          throw new ParserSyntaxError("Can only use 'new' on an identifier", operator);

        const args: AST.Expression[] = [];
        if (this.match(Syntax.LParen) && !this.match(Syntax.RParen)) {
          args.concat(this.parseExpressionList());
          this.consume(Syntax.RParen, "')'");
        }

        return new NewExpression(<Token<undefined, Syntax.New>>operator, operand, args);
      } else if ((operator.syntax === Syntax.PlusPlus || operator.syntax === Syntax.MinusMinus) && !this.isAssignmentTarget(operand))
        throw new ParserSyntaxError("Invalid increment/decrement target", operand.token);

      return new UnaryExpression(operator, operand);
    } else
      return this.parsePostfix();
  }

  private parsePostfix(expr?: AST.Expression): AST.Expression {
    let callee = expr ?? this.parsePrimary();

    if (this.match(Syntax.Dot)) {
      const accessToken = this.previous<undefined>();
      const indexIdentifier = this.consume<string>(Syntax.Identifier);
      indexIdentifier.syntax = Syntax.String;
      indexIdentifier.value = indexIdentifier.lexeme;
      indexIdentifier.lexeme = `"${indexIdentifier.lexeme}"`;

      const index = new LiteralExpression(indexIdentifier);
      callee = new AccessExpression(accessToken, callee, index);
    } else if (this.match(Syntax.LParen)) {
      const args = this.parseExpressionList(Syntax.RParen);
      this.consume(Syntax.RParen, "')'");
      callee = new CallExpression(callee, args);
    } else if (this.check(Syntax.LBracket)) {
      this.consume(Syntax.LBracket);
      if (!this.checkSet([Syntax.RBracket, Syntax.RBrace, Syntax.RParen, Syntax.Identifier], -2))
        return callee;

      const bracket = this.previous<undefined>();
      const index = this.parseExpression();
      this.consume(Syntax.RBracket, "']'");
      callee = new AccessExpression(bracket, callee, index);
    }

    if (this.checkSet(SyntaxSets.POSTFIX_SYNTAXES))
      return this.parsePostfix(callee);

    return callee;
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

  // These have no precedence, since they're declarations
  // This is the reason they're not grouped with the below methods
  protected parseTypeAlias(): [Token<undefined, Syntax.Identifier>, AST.TypeRef] {
    this.consume<undefined>(Syntax.Identifier, "'type' keyword");
    const identifier = this.consume<undefined, Syntax.Identifier>(Syntax.Identifier, "identifier");
    this.consume(Syntax.Equal, "'='");
    const aliasedType = this.parseType();
    return [identifier, aliasedType];
  }

  protected parseClassDeclaration(): ClassDeclarationStatement {
    const keyword = this.previous<undefined, Syntax.Class>();
    const name = this.consume<undefined, Syntax.Identifier>(Syntax.Identifier);
    let superclass: IdentifierExpression | undefined;
    if (this.match(Syntax.LT))
      superclass = new IdentifierExpression(this.consume(Syntax.Identifier));

    const mixins: IdentifierExpression[] = [];
    if (this.match(Syntax.Mixin)) {
      mixins.push(new IdentifierExpression(this.consume(Syntax.Identifier)));
      while (this.match(Syntax.Comma))
        mixins.push(new IdentifierExpression(this.consume(Syntax.Identifier)));
    }

    const brace = this.consume<undefined>(Syntax.LBrace, "'{'");
    let members: ClassMember[] = [];
    if (!this.match(Syntax.RBrace))
      members = this.parseClassMembers();

    const body = new ClassBodyStatement(brace, members);
    const memberSignatures = members.map<[string, ClassMemberSignature<AST.TypeRef>]>(member => {
      const mutable = member instanceof PropertyDeclarationStatement ? member.mutable : false;
      const [name, valueType] = member instanceof PropertyDeclarationStatement ?
        [member.identifier.name.lexeme, member.typeRef]
        : [member.name.lexeme, new FunctionTypeExpression(
          new Map(member.parameters.map(param => [param.identifier.name.lexeme, param.typeRef])),
          member.returnType
        )];

      return [name, {
        modifiers: member.modifiers,
        valueType, mutable
      }];
    });

    const typeRef = new ClassTypeExpression(name, new Map(memberSignatures), mixins, superclass);
    return new ClassDeclarationStatement(
      keyword, name,
      body, typeRef,
      mixins, superclass
    );
  }

  protected parseClassMembers(): ClassMember[] {
    this.typeAnalyzer!.typeTracker.beginTypeScope();
    const members: ClassMember[] = [];

    while (!this.match(Syntax.RBrace)) {
      const modifiers = this.parseModifiers();
      if (this.check(Syntax.Mut)) {
        const { isMutable, valueType, name } = this.parseNamedType(true);
        const nameIdentifier = new IdentifierExpression(fakeToken(Syntax.Identifier, name.token.value, undefined));
        const initializer = this.match(Syntax.Equal) ? this.parseExpression() : undefined;
        this.consumeSemicolons();
        members.push(new PropertyDeclarationStatement(modifiers, valueType, nameIdentifier, isMutable, initializer));
      } else {
        const type = this.parseType();
        if (this.match(Syntax.Function)) {
          const keyword = this.previous<undefined, Syntax.Function>();
          const name = this.consume<undefined, Syntax.Identifier>(Syntax.Identifier);
          const parameters: VariableDeclarationStatement[] = [];

          if (this.match(Syntax.LParen) && !this.match(Syntax.RParen)) {
            parameters.push(this.parseVariableDeclaration());
            while (this.match(Syntax.Comma))
              parameters.push(this.parseVariableDeclaration());

            this.consume(Syntax.RParen, "')'");
          }

          this.consume(Syntax.LBrace, "'{'")
          const body = this.parseBlock();
          members.push(new MethodDeclarationStatement(modifiers, keyword, name, type, parameters, body));
        } else {
          const valueType = this.parseType();
          const name = this.consume<undefined, Syntax.Identifier>(Syntax.Identifier);
          const initializer = this.match(Syntax.Equal) ? this.parseExpression() : undefined;
          this.consumeSemicolons();
          members.push(new PropertyDeclarationStatement(modifiers, valueType, new IdentifierExpression(name), false, initializer));
        }
      }
    }

    this.typeAnalyzer!.typeTracker.endTypeScope();
    return members;
  }

  protected parseModifiers(): ModifierType[] {
    const modifiers: ModifierType[] = [];
    while (this.match(Syntax.Private, Syntax.Protected, Syntax.Static)) {
      const modifierToken = this.previous<undefined>();
      const modifierName = Syntax[modifierToken.syntax];
      modifiers.push(<ModifierType><unknown>ModifierType[<number><unknown>modifierName]);
    }
    return modifiers;
  }

  protected parseInterfaceType(): InterfaceTypeExpression {
    const name = this.consume<undefined, Syntax.Identifier>(Syntax.Identifier);
    this.consume<undefined>(Syntax.LBrace, "'{'");
    const members = new Map<LiteralExpression<string>, InterfaceMemberSignature<AST.TypeRef>>();
    const indexSignatures = new Map<AST.TypeRef, AST.TypeRef>();

    if (!this.match(Syntax.RBrace)) {
      const contents = this.parseInterfaceContents();
      for (const [key, prop] of contents)
        if (key instanceof LiteralExpression)
          members.set(key, prop);
        else
          indexSignatures.set(key, prop.valueType);

      this.consume<undefined>(Syntax.RBrace, "'}'");
    }

    return new InterfaceTypeExpression(name, members, indexSignatures);
  }

  protected parseInterfaceContents(): Map<LiteralExpression<string, Syntax> | AST.TypeRef, InterfaceMemberSignature<AST.TypeRef>> {
    const keyValuePairs = [ this.parseInterfaceKeyValuePair() ];
    while ((this.match(Syntax.Comma, Syntax.Semicolon) || this.checkType() || this.check(Syntax.Mut)) && !this.check(Syntax.RBrace))
      keyValuePairs.push(this.parseInterfaceKeyValuePair());

    return new Map(keyValuePairs);
  }

  protected parseInterfaceKeyValuePair(): [LiteralExpression<string, Syntax> | AST.TypeRef, InterfaceMemberSignature<AST.TypeRef>] {
    let key: AST.TypeRef;
    let valueType: AST.TypeRef;
    let isMutable = false;
    if (this.match(Syntax.LBracket)) {
      key = this.parseType();
      this.consume(Syntax.RBracket, "']'");
      this.consume(Syntax.Colon, "':'");
      valueType = this.parseType();
    } else
      ({ isMutable, valueType, name: key } = this.parseNamedType(true));

    return [key, {
      valueType,
      mutable: isMutable
    }];
  }

  protected parseNamedType(allowMutable = false) {
    const isMutable = allowMutable ? this.match(Syntax.Mut) : false;
    const valueType = this.parseType();
    const identifier = this.consume<undefined>(Syntax.Identifier);
    const name = new LiteralExpression(fakeToken(Syntax.String, `"${identifier.lexeme}"`, identifier.lexeme));
    return { isMutable, valueType, name };
  }

  /**
   * Parses a type reference
   */
  protected parseType(): AST.TypeRef {
    return this.parseFunctionType();
  }

  protected parseFunctionType(): AST.TypeRef {
    if (this.match(Syntax.LParen)) {
      const parameterTypes = new Map<string, AST.TypeRef>();
      if (!this.match(Syntax.RParen)) {
        const parseParameter = () => {
          const { name, valueType } = this.parseNamedType();
          parameterTypes.set(name.token.value, valueType);
        }

        parseParameter();
        while (this.match(Syntax.Comma))
          parseParameter();

        this.consume(Syntax.RParen);
      }


      this.consume(Syntax.ColonColon, "'::'");
      const returnType = this.parseType();
      return new FunctionTypeExpression(parameterTypes, returnType);
    }

    return this.parseUnionType();
  }

  // protected parseIntersectionType(): AST.TypeRef {
  //   let left = this.parseUnionType();

  //   while (this.match(Syntax.Ampersand)) {
  //     const singularTypes: (SingularTypeExpression | ArrayTypeExpression)[] = [];
  //     if (left instanceof UnionTypeExpression)
  //       singularTypes.push(...left.types);
  //     else if (left instanceof SingularTypeExpression || left instanceof ArrayTypeExpression)
  //       singularTypes.push(left);

  //     singularTypes.push(this.parseSingularType());
  //     left = new UnionTypeExpression(singularTypes);
  //   }

  //   return left;
  // }

  protected parseUnionType(): AST.TypeRef {
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

  protected parseArrayType(): AST.TypeRef {
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

  protected parseSingularType(): SingularTypeExpression {
    if (!this.checkType())
      throw new ParserSyntaxError(`Expected type, got '${this.current.lexeme}'`, this.current);

    const typeKeyword = this.advance<TypeLiteralValueType | undefined, TypeNameSyntax>();
    if (typeKeyword.value !== undefined)
      return new LiteralTypeExpression(<Token<TypeLiteralValueType, TypeNameSyntax>>typeKeyword);

    const typeName = typeKeyword.lexeme;
    let typeArgs: AST.TypeRef[] | undefined;
    if (this.match(Syntax.LT)) {
      typeArgs = this.parseTypeList();
      this.consume(Syntax.GT, "'>'");
    }

    if (this.typeAnalyzer!.typeTracker.isCustomType(typeName))
      return this.typeAnalyzer!.typeTracker.getRef(typeName)!;

    return new SingularTypeExpression(typeKeyword, typeArgs);
  }

  /**
   * Parses a list of type references separated by commas
   *
   * Must have at least one type
   */
  protected parseTypeList(): AST.TypeRef[] {
    const types = [ this.parseType() ];
    while (this.match(Syntax.Comma))
      types.push(this.parseType());

    return types;
  }

  /**
   * @returns Whether or not we matched a type reference
   */
  protected matchType(offset = 0): boolean {
    if (this.checkType(offset)) {
      this.advance();
      return true;
    }
    return false;
  }

  /**
   * @returns Whether or not we're currently at a type reference
   */
  protected checkType(offset = 0): boolean {
    return (this.check(Syntax.LParen, offset) && (
      this.checkType(offset + 1)
      || (this.check(Syntax.RParen, offset + 1) && this.check(Syntax.ColonColon, offset + 2))
    ))
    || (
      this.checkSet([Syntax.Identifier, Syntax.Undefined, Syntax.Null], offset)
      && this.typeAnalyzer!.typeTracker.isTypeDefined(this.peek(offset)!.lexeme)
    )
    || this.checkSet([Syntax.String, Syntax.Boolean, Syntax.Int, Syntax.Float], offset)
  }
}