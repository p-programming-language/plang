import { ReferenceError, ResolutionError } from "../errors";
import type { Token } from "./tokenization/token";
import { ScopeContext } from "./resolver-contexts";
import AST from "../code-analysis/parser/ast";

import type { ArrayLiteralExpression } from "./parser/ast/expressions/array-literal";
import type { ObjectLiteralExpression } from "./parser/ast/expressions/object-literal";
import type { StringInterpolationExpression } from "./parser/ast/expressions/string-interpolation";
import type { ParenthesizedExpression } from "../code-analysis/parser/ast/expressions/parenthesized";
import type { UnaryExpression } from "../code-analysis/parser/ast/expressions/unary";
import type { BinaryExpression } from "../code-analysis/parser/ast/expressions/binary";
import type { TernaryExpression } from "./parser/ast/expressions/ternary";
import type { IdentifierExpression } from "../code-analysis/parser/ast/expressions/identifier";
import type { CompoundAssignmentExpression } from "./parser/ast/expressions/compound-assignment";
import type { VariableAssignmentExpression } from "./parser/ast/expressions/variable-assignment";
import type { PropertyAssignmentExpression } from "./parser/ast/expressions/property-assignment";
import type { CallExpression } from "./parser/ast/expressions/call";
import type { AccessExpression } from "./parser/ast/expressions/access";
import type { IsExpression } from "./parser/ast/expressions/is";
import type { TypeOfExpression } from "./parser/ast/expressions/typeof";
import type { IsInExpression } from "./parser/ast/expressions/is-in";
import type { ExpressionStatement } from "./parser/ast/statements/expression";
import type { VariableAssignmentStatement } from "./parser/ast/statements/variable-assignment";
import type { VariableDeclarationStatement } from "../code-analysis/parser/ast/statements/variable-declaration";
import type { BlockStatement } from "./parser/ast/statements/block";
import type { IfStatement } from "./parser/ast/statements/if";
import type { WhileStatement } from "./parser/ast/statements/while";
import type { FunctionDeclarationStatement } from "./parser/ast/statements/function-declaration";
import type { ReturnStatement } from "./parser/ast/statements/return";
import type { UseStatement } from "./parser/ast/statements/use";
import type { EveryStatement } from "./parser/ast/statements/every";
import { NewExpression } from "./parser/ast/expressions/new";
import { ClassBodyStatement } from "./parser/ast/statements/class-body";
import { ClassDeclarationStatement } from "./parser/ast/statements/class-declaration";
import { MethodDeclarationStatement } from "./parser/ast/statements/method-declaration";
import { PropertyDeclarationStatement } from "./parser/ast/statements/property-declaration";

export default class Resolver implements AST.Visitor.Expression<void>, AST.Visitor.Statement<void> {
  public withinFunction = false;
  public scopeContext = ScopeContext.Global;
  private scopes: Map<string, boolean>[] = []; // the boolean represents whether the variable is defined or not. a variable can be declared without being defined

  public constructor() {
    this.beginScope();
  }

  public visitMethodDeclarationStatement(stmt: MethodDeclarationStatement): void {
    this.resolveFunction(stmt);
  }

  public visitPropertyDeclarationStatement(stmt: PropertyDeclarationStatement): void {
    if (stmt.initializer)
      this.resolve(stmt.initializer);
  }

  public visitClassBodyStatement(stmt: ClassBodyStatement): void {
    this.scopeContext = ScopeContext.Class;
    this.resolve(stmt.members);
    this.scopeContext = ScopeContext.Global;
  }

  public visitClassDeclarationStatement(stmt: ClassDeclarationStatement): void {
    this.declare(stmt.name);
    this.define(stmt.name);
    this.resolve(stmt.body);
  }

  public visitNewExpression(expr: NewExpression): void {
    this.resolve(expr.classRef);
    for (const arg of expr.constructorArgs)
      this.resolve(arg);
  }

  public visitEveryStatement(stmt: EveryStatement): void {
    this.beginScope();
    this.resolve(stmt.elementDeclarations);
    this.resolve(stmt.iterable);
    this.resolve(stmt.body);
    this.endScope();
  }

  public visitNextStatement(): void {
    // do nothing
  }

  public visitBreakStatement(): void {
    // do nothing
  }

  public visitUseStatement(stmt: UseStatement): void {
    if (this.scopeContext !== ScopeContext.Global)
      throw new ResolutionError(`Imports cannot be used outside of the global scope`, stmt.keyword);

    if (typeof stmt.members === "boolean") return;
    for (const member of stmt.members) {
      this.declare(member);
      this.define(member);
    }
  }

  public visitTypeDeclarationStatement(): void {
    // do nothing
  }

  public visitReturnStatement(stmt: ReturnStatement): void {
    if (!this.withinFunction)
      throw new ResolutionError("Invalid return statement: Can only use 'return' within a function body", stmt.token);

    this.resolve(stmt.expression);
  }

  public visitFunctionDeclarationStatement(stmt: FunctionDeclarationStatement): void {
    this.declare(stmt.name);
    this.define(stmt.name);
    this.resolveFunction(stmt);
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
    const enclosingContext = this.scopeContext;
    this.scopeContext = ScopeContext.Block;
    this.resolve(stmt.members);
    this.scopeContext = enclosingContext;
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

  public visitExpressionStatement(stmt: ExpressionStatement): void {
    this.resolve(stmt.expression);
  }

  public visitIsInExpression(expr: IsInExpression): void {
    this.resolve(expr.value);
    this.resolve(expr.object);
  }

  public visitIsExpression(expr: IsExpression): void {
    this.resolve(expr.value);
  }

  public visitTypeOfExpression(expr: TypeOfExpression): void {
    this.resolve(expr.operand);
  }

  public visitIndexExpression(expr: AccessExpression): void {
    this.resolve(expr.object);
    this.resolve(expr.index);
  }

  public visitCallExpression(expr: CallExpression): void {
    this.resolve(expr.callee);
    for (const arg of expr.args)
      this.resolve(arg);
  }

  public visitPropertyAssignmentExpression(expr: PropertyAssignmentExpression): void {
    this.resolve(expr.access);
    this.resolve(expr.value);
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

  public visitStringInterpolationExpression(expr: StringInterpolationExpression): void {
    for (const part of expr.parts)
      this.resolve(part);
  }

  public visitObjectLiteralExpression(expr: ObjectLiteralExpression): void {
    for (const [key, value] of expr.properties) {
      this.resolve(key);
      this.resolve(value);
    }
  }

  public visitArrayLiteralExpression(expr: ArrayLiteralExpression): void {
    for (const element of expr.elements)
      this.resolve(element);
  }

  public visitRangeLiteralExpression(): void {
    // do nothing
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

  private resolveFunction(fn: FunctionDeclarationStatement): void {
    const enclosingWithin = this.withinFunction;
    this.withinFunction = true;
    this.beginScope();

    for (const param of fn.parameters) {
      this.declare(param.identifier.name);
      this.define(param.identifier.name);
    }

    this.resolve(fn.body);
    this.endScope();
    this.withinFunction = enclosingWithin;
  }

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