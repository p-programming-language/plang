import util from "util";

import { RuntimeError } from "../errors";
import type { ValueType } from "../code-analysis/type-checker";
import { Token } from "../code-analysis/syntax/token";
import { fakeToken } from "../utility";
import type { Callable } from "./types/callable";
import type Binder from "../code-analysis/type-checker/binder";
import type Resolver from "../code-analysis/resolver";
import Scope from "./scope";
import PFunction from "./types/function";
import HookedException from "./hooked-exceptions";
import Intrinsics from "./intrinsics";
import Syntax from "../code-analysis/syntax/syntax-type";
import AST from "../code-analysis/parser/ast";
import P from "../../tools/p";

import { LiteralExpression } from "../code-analysis/parser/ast/expressions/literal";
import type { ArrayLiteralExpression } from "../code-analysis/parser/ast/expressions/array-literal";
import type { StringInterpolationExpression } from "../code-analysis/parser/ast/expressions/string-interpolation";
import type { ParenthesizedExpression } from "../code-analysis/parser/ast/expressions/parenthesized";
import type { UnaryExpression } from "../code-analysis/parser/ast/expressions/unary";
import { BinaryExpression } from "../code-analysis/parser/ast/expressions/binary";
import type { TernaryExpression } from "../code-analysis/parser/ast/expressions/ternary";
import { IdentifierExpression } from "../code-analysis/parser/ast/expressions/identifier";
import { CompoundAssignmentExpression } from "../code-analysis/parser/ast/expressions/compound-assignment";
import { VariableAssignmentExpression } from "../code-analysis/parser/ast/expressions/variable-assignment";
import type { CallExpression } from "../code-analysis/parser/ast/expressions/call";
import type { ExpressionStatement } from "../code-analysis/parser/ast/statements/expression";
import type { PrintlnStatement } from "../code-analysis/parser/ast/statements/println";
import type { VariableAssignmentStatement } from "../code-analysis/parser/ast/statements/variable-assignment";
import type { VariableDeclarationStatement } from "../code-analysis/parser/ast/statements/variable-declaration";
import type { BlockStatement } from "../code-analysis/parser/ast/statements/block";
import type { IfStatement } from "../code-analysis/parser/ast/statements/if";
import type { WhileStatement } from "../code-analysis/parser/ast/statements/while";
import type { IndexExpression } from "../code-analysis/parser/ast/expressions";
import { PropertyAssignmentExpression } from "../code-analysis/parser/ast/expressions/property-assignment";
import type { FunctionDeclarationStatement } from "../code-analysis/parser/ast/statements/function-declaration";
import type { ReturnStatement } from "../code-analysis/parser/ast/statements/return";

const MAX_RECURSION_DEPTH = 1200;

export default class Interpreter implements AST.Visitor.Expression<ValueType>, AST.Visitor.Statement<void> {
  public readonly globals = new Scope;
  public scope = this.globals;

  private loopLevel = 0;
  private recursionDepth = 1;

  public constructor(
    public readonly runner: P,
    public readonly resolver: Resolver,
    public readonly binder: Binder
  ) {

    const intrinsics = new Intrinsics(this);
    intrinsics.inject();
  }

  public visitReturnStatement(stmt: ReturnStatement): void {
    const value = this.evaluate(stmt.expression);
    throw new HookedException.Return(stmt.token, value);
  }

  public visitFunctionDeclarationStatement(stmt: FunctionDeclarationStatement): void {
    const fn = new PFunction(this, this.scope, stmt);
    this.scope.define(stmt.name, fn, {
      mutable: false
    });
  }

  public visitWhileStatement(stmt: WhileStatement): void {
    this.loopLevel++;
    const inverted = stmt.token.syntax === Syntax.Until;
    let depth = 0;

    while (inverted ? !this.evaluate(stmt.condition) : this.evaluate(stmt.condition)) {
      this.startRecursion(stmt.token);
      this.execute(stmt.body);
      depth++;
    }

    this.endRecursion(depth);
    this.loopLevel--;
  }

  public visitIfStatement(stmt: IfStatement): void {
    const condition = this.evaluate(stmt.condition);
    const inverted = stmt.token.syntax === Syntax.Unless;

    if (inverted ? !condition : condition)
      this.execute(stmt.body)
    else if (stmt.elseBranch)
      this.execute(stmt.elseBranch);
  }

  public visitBlockStatement(stmt: BlockStatement): void {
    this.evaluate(stmt.statements);
  }

  public visitVariableDeclarationStatement(stmt: VariableDeclarationStatement): void {
    const value = stmt.initializer ? this.evaluate(stmt.initializer) : undefined;
    this.scope.define(stmt.identifier.name, value, {
      mutable: stmt.mutable
    });
  }

  public visitVariableAssignmentStatement(stmt: VariableAssignmentStatement): void {
    const value = this.evaluate(stmt.value);
    this.scope.assign(stmt.identifier.name, value);
  }

  public visitPrintlnStatement(stmt: PrintlnStatement): void {
    console.log(...stmt.expressions.map(expr => this.evaluate(expr)).map(value => value?.toString()));
  }

  public visitExpressionStatement(stmt: ExpressionStatement): ValueType {
    return this.evaluate(stmt.expression);
  }

  public visitIndexExpression(expr: IndexExpression): ValueType {
    const object = this.evaluate(expr.object);
    const index = this.evaluate(expr.index);
    return (<any[]>object)[<number>index]; // modify to work with objects, any[] | Record and number | string
  }

  public visitCallExpression(expr: CallExpression): ValueType {
    const fn = <Callable>this.evaluate(expr.callee);
    const fitsArity = typeof fn.arity === "number" ? expr.args.length === fn.arity : fn.arity.isWithin(expr.args.length);
    if (!fitsArity)
      throw new RuntimeError(`Expected '${expr.callee.token.lexeme}' to have ${fn.arity.toString()} arguments, got ${expr.args.length}`, expr.callee.token)

    const args = expr.args.map(arg => this.evaluate(arg));
    return fn.call(...args);
  }

  public visitPropertyAssignmentExpression(expr: PropertyAssignmentExpression): ValueType {
    const value = this.evaluate(expr.value);
    const object = this.evaluate(expr.access.object);
    const index = this.evaluate(expr.access.index);
    (<any[]>object)[<number>index] = value; // modify to work with objects, any[] | Record and number | string
    return value;
  }

  public visitVariableAssignmentExpression(expr: VariableAssignmentExpression): ValueType {
    const value = this.evaluate(expr.value);
    this.scope.assign(expr.identifier.name, value);
    return value;
  }

  public visitCompoundAssignmentExpression(expr: CompoundAssignmentExpression): ValueType {
    const operatorSyntaxName = Syntax[expr.operator.syntax];
    const fixedOperator = new Token(
      <Syntax><unknown>Syntax[<number><unknown>operatorSyntaxName.replace(/Equal/, "")],
      expr.operator.lexeme.replace(/=/, ""),
      undefined,
      expr.operator.locationSpan
    );

    const binary = new BinaryExpression(expr.left, expr.right, fixedOperator);
    const assignment = expr.left instanceof IdentifierExpression ?
      new VariableAssignmentExpression(expr.left, binary)
      : new PropertyAssignmentExpression(expr.left, binary);

    return this.evaluate(assignment);
  }

  public visitIdentifierExpression(expr: IdentifierExpression): ValueType {
    return this.scope.get(expr.name);
  }

  public visitTernaryExpression(expr: TernaryExpression): ValueType {
    return this.evaluate(expr.condition) ?
      this.evaluate(expr.body)
      : this.evaluate(expr.elseBranch);
  }

  public visitUnaryExpression(expr: UnaryExpression): ValueType {
    const operand = this.evaluate(expr.operand);
    const one = new LiteralExpression(fakeToken(Syntax.Int, "1", 1));
    switch(expr.operator.syntax) {
      case Syntax.Bang:
        if (typeof operand !== "boolean")
          return operand === undefined;
        else
          return !operand
      case Syntax.Tilde:
        return ~<number>operand;
      case Syntax.Plus:
        return +<number>operand;
      case Syntax.Minus:
        return -<number>operand;
      case Syntax.Hashtag:
        return (<Array<any>>operand).length;
      case Syntax.PlusPlus: {
        const compoundOperator = fakeToken<undefined>(Syntax.PlusEqual, "+=");
        const compoundAssignment = new CompoundAssignmentExpression(<IdentifierExpression>expr.operand, one, compoundOperator);
        return this.evaluate(compoundAssignment);
      }
      case Syntax.MinusMinus: {
        const compoundOperator = fakeToken<undefined>(Syntax.MinusEqual, "-=");
        const compoundAssignment = new CompoundAssignmentExpression(<IdentifierExpression>expr.operand, one, compoundOperator);
        return this.evaluate(compoundAssignment);
      }

      default:
        throw new RuntimeError(`(BUG) Unhandled unary operator: ${expr.operator.lexeme}`, expr.operator);
    }
  }

  public visitBinaryExpression(expr: BinaryExpression): ValueType {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);
    switch(expr.operator.syntax) {
      case Syntax.Plus:
        return <string & number>left + <string & number>right;
      case Syntax.Minus:
        return <number>left - <number>right;
      case Syntax.Star:
        if (typeof left === "number")
          return <number>left * <number>right;
        else
          return (<string>left).repeat(<number>right);
      case Syntax.Slash:
        // if (typeof left === "number")
          return <number>left / <number>right;
        // else
        //   return (<string>left).split(<string>right);
      case Syntax.SlashSlash:
        return Math.floor(<number>left / <number>right);
      case Syntax.StarStar:
      case Syntax.Carat:
        return (<number>left) ** <number>right;
      case Syntax.Percent:
        return <number>left % <number>right;
      case Syntax.Ampersand:
        return <number>left & <number>right;
      case Syntax.Pipe:
        return <number>left | <number>right;
      case Syntax.Tilde:
        return <number>left ^ <number>right;
      case Syntax.LDoubleArrow:
        return <number>left << <number>right;
      case Syntax.RDoubleArrow:
        return <number>left >> <number>right;
      case Syntax.EqualEqual:
        return left === right;
      case Syntax.BangEqual:
        return left !== right;
      case Syntax.LT:
        return <number>left < <number>right;
      case Syntax.LTE:
        return <number>left <= <number>right;
      case Syntax.GT:
        return <number>left > <number>right;
      case Syntax.GTE:
        return <number>left >= <number>right;
      case Syntax.QuestionQuestion:
        return left ?? right;
      case Syntax.AmpersandAmpersand:
        return left && right;
      case Syntax.PipePipe:
        return left || right;

      default:
        throw new RuntimeError(`(BUG) Unhandled binary operator: ${expr.operator.lexeme}`, expr.operator);
    }
  }

  public visitParenthesizedExpression(expr: ParenthesizedExpression): ValueType {
    return this.evaluate(expr.expression);
  }

  public visitStringInterpolationExpression(expr: StringInterpolationExpression): ValueType {
    return expr.parts.map(part =>
      part === undefined ?
        "undefined"
        : (part === null ?
          "null"
          : this.evaluate(part)!.toString()
        )
    ).join("");
  }

  public visitArrayLiteralExpression(expr: ArrayLiteralExpression): ValueType {
    return expr.elements.map(element => this.evaluate(element));
  }

  public visitLiteralExpression<V extends ValueType = ValueType>(expr: LiteralExpression<V>): V {
    return expr.token.value;
  }

  public execute(statement: AST.Statement): void {
    this.evaluate(statement);
  }

  public evaluate<T extends AST.Expression | AST.Statement = AST.Expression | AST.Statement>(statements: T | AST.Statement[]): ValueType {
    if (statements instanceof Array) {
      let lastResult: ValueType;
      for (const statement of statements)
        lastResult = statement.accept(this);

      return lastResult;
    } else
      return statements.accept(this);
  }

  private startRecursion(token: Token<undefined>): void {
    this.recursionDepth++;
    if (this.recursionDepth < MAX_RECURSION_DEPTH) return;
    throw new RuntimeError(`Stack overflow: Recursion depth of ${MAX_RECURSION_DEPTH} exceeded`, token);
  }

  private endRecursion(level = 1): void {
    this.recursionDepth -= level;
  }
}