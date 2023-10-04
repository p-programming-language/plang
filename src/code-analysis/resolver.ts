import { ReferenceError } from "../errors";
import type { Token } from "./syntax/token";
import AST from "../code-analysis/parser/ast";

import type { ParenthesizedExpression } from "../code-analysis/parser/ast/expressions/parenthesized";
import type { UnaryExpression } from "../code-analysis/parser/ast/expressions/unary";
import type { BinaryExpression } from "../code-analysis/parser/ast/expressions/binary";
import { IdentifierExpression } from "../code-analysis/parser/ast/expressions/identifier";
import type { CompoundAssignmentExpression } from "./parser/ast/expressions/compound-assignment";
import type { VariableAssignmentExpression } from "./parser/ast/expressions/variable-assignment";
import type { ExpressionStatement } from "./parser/ast/statements/expression";
import type { VariableAssignmentStatement } from "./parser/ast/statements/variable-assignment";
import type { VariableDeclarationStatement } from "../code-analysis/parser/ast/statements/variable-declaration";
import { ArrayLiteralExpression } from "./parser/ast/expressions/array-literal";

export default class Resolver implements AST.Visitor.Expression<void>, AST.Visitor.Statement<void> {
  // the boolean represents whether the variable is defined or not
  public readonly locals = new Map<AST.Node, number>;
  private scopes: Map<string, boolean>[] = [];

  public constructor() {
    this.beginScope();
  }

  public visitVariableDeclarationStatement(stmt: VariableDeclarationStatement): void {
    this.declare(stmt.identifier.token);
    if (stmt.initializer)
      this.resolve(stmt.initializer);

    this.define(stmt.identifier.token);
  }

  public visitVariableAssignmentStatement(stmt: VariableAssignmentStatement): void {
    this.resolve(stmt.identifier);
    this.resolve(stmt.value);
    this.resolveLocal(stmt, stmt.identifier.token);
  }

  public visitExpressionStatement(stmt: ExpressionStatement): void {
    this.resolve(stmt.expression);
  }

  public visitVariableAssignmentExpression(expr: VariableAssignmentExpression): void {
    this.resolve(expr.identifier);
    this.resolve(expr.value);
    this.resolveLocal(expr, expr.identifier.token);
  }

  public visitCompoundAssignmentExpression(expr: CompoundAssignmentExpression): void {
    const leftIsIdentifier = expr.left instanceof IdentifierExpression;
    if (!leftIsIdentifier)
      this.resolve(expr.left);

    this.resolve(expr.right);
    if (leftIsIdentifier)
      this.resolveLocal(expr, expr.left.token);
  }

  public visitIdentifierExpression(expr: IdentifierExpression): void {
    const scope = this.scopes.at(-1);
    if (this.scopes.length > 0 && scope!.get(expr.token.lexeme) === false)
      throw new ReferenceError(`Cannot read variable '${expr.token.lexeme}' in it's own initializer`, expr.token);

    if (this.isDefined(expr.token) === undefined)
      throw new ReferenceError(`'${expr.token.lexeme}' is not defined in this scope`, expr.token);

    this.resolveLocal(expr, expr.token);
  }

  public visitUnaryExpression(expr: UnaryExpression): void {
    this.resolve(expr.operand);
  }

  public visitBinaryExpression(expr: BinaryExpression): void {
    this.resolve(expr.left);
    this.resolve(expr.right);
  }

  public visitParenthesizedExpression(expr: ParenthesizedExpression): void {
    this.resolve(expr.expression);
  }

  public visitArrayLiteralExpression(expr: ArrayLiteralExpression): void {
    for (const element of expr.elements)
      this.resolve(element);
  }

  public visitLiteralExpression(): void {
    // do nothing
  }

  public resolve<T extends AST.Expression | AST.Statement = AST.Expression | AST.Statement>(statements: T | AST.Statement[]): void {
    if (statements instanceof Array)
      for (const statement of <AST.Statement[]>statements)
        this.resolve(statement);
    else if (statements instanceof AST.Statement)
      (<AST.Statement>statements).accept(this);
    else if (statements instanceof AST.Expression)
      (<AST.Expression>statements).accept(this);
  }

  private isDefined(identifier: Token): boolean | undefined {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const scope = this.scopes[i];
      if (scope?.has(identifier.lexeme))
        return scope.get(identifier.lexeme);
    }
  }

  private resolveLocal(expr: AST.Node, identifier: Token): void {
    for (let i = this.scopes.length - 1; i >= 0; i--)
      if (this.scopes[i]?.has(identifier.lexeme)) {
        this.locals.set(expr, this.scopes.length - i);
        return;
      }
  }

  private beginScope(): void {
    this.scopes.push(new Map<string, boolean>);
  }

  private endScope(): void {
    this.scopes.pop();
  }

  private declare(identifier: Token): void {
    if (this.scopes.length === 0) return;

    const scope = this.scopes.at(-1);
    if (scope?.has(identifier.lexeme))
      throw new ReferenceError(`Variable '${identifier.lexeme}' is already declared is this scope`, identifier);

    scope?.set(identifier.lexeme, false);
  }

  private define(identifier: Token): void {
    if (this.scopes.length === 0) return;

    const scope = this.scopes.at(-1);
    scope?.set(identifier.lexeme, true);
  }
}