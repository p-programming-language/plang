import AST from "../code-analysis/parser/ast";

import { ResolutionError } from "../errors";
import type { Token } from "./syntax/token";
import type { LiteralExpression } from "../code-analysis/parser/ast/expressions/literal";
import type { ParenthesizedExpression } from "../code-analysis/parser/ast/expressions/parenthesized";
import type { UnaryExpression } from "../code-analysis/parser/ast/expressions/unary";
import type { BinaryExpression } from "../code-analysis/parser/ast/expressions/binary";
import { IdentifierExpression } from "../code-analysis/parser/ast/expressions/identifier";
import type { CompoundAssignmentExpression } from "./parser/ast/expressions/compound-assignment";
import type { VariableAssignmentExpression } from "./parser/ast/expressions/variable-assignment";
import type { VariableAssignmentStatement } from "./parser/ast/statements/variable-assignment";
import type { VariableDeclarationStatement } from "../code-analysis/parser/ast/statements/variable-declaration";
import { ExpressionStatement } from "./parser/ast/statements/expression";

export default class Resolver implements AST.Visitor.Expression<void>, AST.Visitor.Statement<void> {
  // the boolean represents whether the variable is defined or not
  public readonly locals = new Map<AST.Node, number>;
  private readonly scopes: Map<string, boolean>[] = [];

  public visitVariableDeclarationStatement(stmt: VariableDeclarationStatement): void {
    this.declare(stmt.identifier.name);
    if (stmt.initializer)
      this.resolve(stmt.initializer);

    this.define(stmt.identifier.name);
  }

  public visitVariableAssignmentStatement(stmt: VariableAssignmentStatement): void {
    this.resolve(stmt.value);
    this.resolveLocal(stmt, stmt.identifier.name);
  }

  public visitExpressionStatement(stmt: ExpressionStatement): void {
    this.resolve(stmt.expression);
  }

  public visitVariableAssignmentExpression(expr: VariableAssignmentExpression): void {
    this.resolve(expr.value);
    this.resolveLocal(expr, expr.identifier.name);
  }

  public visitCompoundAssignmentExpression(expr: CompoundAssignmentExpression): void {
    const leftIsIdentifier = expr.left instanceof IdentifierExpression;
    if (!leftIsIdentifier)
      this.resolve(expr.left);

    this.resolve(expr.right);
    if (leftIsIdentifier)
      this.resolveLocal(expr, expr.left.name);
  }

  public visitIdentifierExpression(expr: IdentifierExpression): void {
    if (this.scopes.length > 0 && this.scopes.at(-1)?.get(expr.name.lexeme) === false)
      throw new ResolutionError(`Cannot read local variable (${expr.name}) in it's own initializer`);

    this.resolveLocal(expr, expr.name);
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

  public visitLiteralExpression(expr: LiteralExpression): void {
    // do nothing
  }

  public resolveStatements(statements: AST.Statement[]): void {
    for (const stmt of statements)
      this.resolve(stmt);
  }

  private resolve<T extends AST.Expression | AST.Statement = AST.Expression | AST.Statement>(node: T): void {
    node.accept(this);
  }

  private resolveLocal(expr: AST.Node, identifier: Token): void {
    for (let i = this.scopes.length; i >= 0; i--)
      if (this.scopes.at(i)?.has(identifier.lexeme)) {
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
      throw new ResolutionError(`Variable '${identifier.lexeme}' is already declared is this scope`);

    scope?.set(identifier.lexeme, false);
  }

  private define(identifier: Token): void {
    if (this.scopes.length === 0) return;
    this.scopes.at(-1)?.set(identifier.lexeme, true);
  }
}