import { ReferenceError } from "../errors";
import type { Token } from "./syntax/token";
import AST from "../code-analysis/parser/ast";

import type { ArrayLiteralExpression } from "./parser/ast/expressions/array-literal";
import type { ParenthesizedExpression } from "../code-analysis/parser/ast/expressions/parenthesized";
import type { UnaryExpression } from "../code-analysis/parser/ast/expressions/unary";
import type { BinaryExpression } from "../code-analysis/parser/ast/expressions/binary";
import type { TernaryExpression } from "./parser/ast/expressions/ternary";
import type { IdentifierExpression } from "../code-analysis/parser/ast/expressions/identifier";
import type { CompoundAssignmentExpression } from "./parser/ast/expressions/compound-assignment";
import type { VariableAssignmentExpression } from "./parser/ast/expressions/variable-assignment";
import type { CallExpression } from "./parser/ast/expressions/call";
import type { ExpressionStatement } from "./parser/ast/statements/expression";
import type { PrintlnStatement } from "./parser/ast/statements/println";
import type { VariableAssignmentStatement } from "./parser/ast/statements/variable-assignment";
import type { VariableDeclarationStatement } from "../code-analysis/parser/ast/statements/variable-declaration";
import type { BlockStatement } from "./parser/ast/statements/block";
import type { IfStatement } from "./parser/ast/statements/if";
import type { WhileStatement } from "./parser/ast/statements/while";

const enum ScopeContext {
  Global,
  Function
}

export default class Resolver implements AST.Visitor.Expression<void>, AST.Visitor.Statement<void> {
  public readonly locals = new Map<AST.Node, number>;
  private scopes: Map<string, boolean>[] = []; // the boolean represents whether the variable is defined or not. a variable can be declared without being defined
  private context = ScopeContext.Global;

  public constructor() {
    this.beginScope();
  }

  public visitWhileStatement(stmt: WhileStatement): void {
    this.resolve(stmt.condition);
    this.resolve(stmt.body);
  }

  public visitIfStatement(stmt: IfStatement): void {
    this.resolve(stmt.condition);
    this.resolve(stmt.body);
    if (!stmt.elseBranch) return;
    this.resolve(stmt.elseBranch);
  }

  public visitBlockStatement(stmt: BlockStatement): void {
    this.resolve(stmt.statements);
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
  }

  public visitPrintlnStatement(stmt: PrintlnStatement): void {
    for (const expression of stmt.expressions)
      this.resolve(expression);
  }

  public visitExpressionStatement(stmt: ExpressionStatement): void {
    this.resolve(stmt.expression);
  }

  public visitCallExpression(expr: CallExpression): void {
    this.resolve(expr.callee);
    for (const arg of expr.args)
      this.resolve(arg);
  }

  public visitVariableAssignmentExpression(expr: VariableAssignmentExpression): void {
    this.resolve(expr.identifier);
    this.resolve(expr.value);
  }

  public visitCompoundAssignmentExpression(expr: CompoundAssignmentExpression): void {
    this.resolve(expr.left);
    this.resolve(expr.right);
  }

  public visitIdentifierExpression(expr: IdentifierExpression): void {
    const scope = this.scopes.at(-1);
    if (this.scopes.length > 0 && scope!.get(expr.token.lexeme) === false)
      throw new ReferenceError(`Cannot read variable '${expr.token.lexeme}' in it's own initializer`, expr.token);

    if (!this.isDefined(expr.token))
      throw new ReferenceError(`'${expr.token.lexeme}' is not defined in this scope`, expr.token);
  }

  public visitTernaryExpression(expr: TernaryExpression): void {
    this.resolve(expr.condition);
    this.resolve(expr.body);
    this.resolve(expr.elseBranch);
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

  public define(identifier: Token): void {
    if (this.scopes.length === 0) return;

    const scope = this.scopes.at(-1);
    scope?.set(identifier.lexeme, true);
  }

  private declare(identifier: Token): void {
    if (this.scopes.length === 0) return;

    const scope = this.scopes.at(-1);
    if (scope?.has(identifier.lexeme))
      throw new ReferenceError(`Variable '${identifier.lexeme}' is already declared is this scope`, identifier);

    scope?.set(identifier.lexeme, false);
  }

  // private resolveFunction(fn: FunctionDeclarationStatement, context: ScopeContext): void {
  //   const enclosingContext = this.context;
  //   this.context = context;
  //   this.beginScope();

  //   for (const param of fn.parameters) {
  //     this.declare(param.name);
  //     this.define(param.name);
  //   }

  //   this.resolve(fn.body);
  //   this.endScope();
  //   this.context = enclosingContext;
  // }

  private isDefined(identifier: Token): boolean {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const scope = this.scopes[i];
      if (scope?.has(identifier.lexeme))
        return scope.get(identifier.lexeme)!;
    }
    return false;
  }

  private beginScope(): void {
    this.scopes.push(new Map<string, boolean>);
  }

  private endScope(): void {
    this.scopes.pop();
  }
}