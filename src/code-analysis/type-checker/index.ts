import { TypeError } from "../../errors";
import { BoundExpression, BoundNode, BoundStatement } from "./binder/bound-node";
import type { Type } from "./types/type";
import type FunctionType from "./types/function-type";
import AST from "../parser/ast";

import type BoundArrayLiteralExpression from "./binder/bound-expressions/array-literal";
import type BoundParenthesizedExpression from "./binder/bound-expressions/parenthesized";
import type BoundUnaryExpression from "./binder/bound-expressions/unary";
import type BoundBinaryExpression from "./binder/bound-expressions/binary";
import type BoundTernaryExpression from "./binder/bound-expressions/ternary";
import type BoundCompoundAssignmentExpression from "./binder/bound-expressions/compound-assignment";
import type BoundVariableAssignmentExpression from "./binder/bound-expressions/variable-assignment";
import type BoundCallExpression from "./binder/bound-expressions/call";
import type BoundExpressionStatement from "./binder/bound-statements/expression";
import type BoundPrintlnStatement from "./binder/bound-statements/println";
import type BoundVariableAssignmentStatement from "./binder/bound-statements/variable-assignment";
import type BoundVariableDeclarationStatement from "./binder/bound-statements/variable-declaration";
import type BoundBlockStatement from "./binder/bound-statements/block";
import type BoundIfStatement from "./binder/bound-statements/if";
import type BoundWhileStatement from "./binder/bound-statements/while";

export type ValueType = string | number | boolean | null | undefined | void | ValueType[];

// NOTE: always call check() before assert()

export class TypeChecker implements AST.Visitor.BoundExpression<void>, AST.Visitor.BoundStatement<void> {
  public visitWhileStatement(stmt: BoundWhileStatement): void {
    this.check(stmt.condition);
    this.check(stmt.body);
  }

  public visitIfStatement(stmt: BoundIfStatement): void {
    this.check(stmt.condition);
    this.check(stmt.body);
    if (!stmt.elseBranch) return;
    this.check(stmt.elseBranch);
  }

  public visitBlockStatement(stmt: BoundBlockStatement): void {
    this.check(stmt.statements);
  }

  public visitVariableDeclarationStatement(stmt: BoundVariableDeclarationStatement): void {
    if (!stmt.initializer) return;
    this.check(stmt.initializer);
    this.assert(stmt.initializer, stmt.initializer.type, stmt.symbol.type);
  }

  public visitVariableAssignmentStatement(stmt: BoundVariableAssignmentStatement): void {
    this.check(stmt.value);
    this.assert(stmt.value, stmt.value.type, stmt.symbol.type);
  }

  public visitPrintlnStatement(stmt: BoundPrintlnStatement): void {
    for (const expression of stmt.expressions)
      this.check(expression);
  }

  public visitExpressionStatement(stmt: BoundExpressionStatement): void {
    this.check(stmt.expression);
  }

  public visitCallExpression(expr: BoundCallExpression): void {
    this.check(expr.callee);
    if (!expr.callee.type.isFunction())
      throw new TypeError(`Attempt to call '${expr.callee.type.toString()}'`, expr.callee.token);

    const type = <FunctionType>expr.callee.type;
    const expectedTypes = Array.from(type.parameterTypes.values());
    for (const arg of expr.args) {
      this.check(arg);
      this.assert(arg, arg.type, expectedTypes[expr.args.indexOf(arg)]);
    }
  }

  public visitVariableAssignmentExpression(expr: BoundVariableAssignmentExpression): void {
    this.check(expr.value);
    this.assert(expr.value, expr.value.type, expr.symbol.type);
  }

  public visitCompoundAssignmentExpression(expr: BoundCompoundAssignmentExpression): void {
    this.check(expr.left);
    this.check(expr.right);
    this.assert(expr.left, expr.left.type, expr.operator.leftType);
    this.assert(expr.right, expr.right.type, expr.operator.rightType);
    this.assert(expr.left, expr.left.type, expr.right.type);
  }

  public visitIdentifierExpression(): void {
    // do nothing
  }

  public visitUnaryExpression(expr: BoundUnaryExpression): void {
    this.check(expr.operand);
    this.assert(expr.operand, expr.operand.type, expr.operator.operandType);
  }

  public visitTernaryExpression(expr: BoundTernaryExpression): void {
    this.check(expr.condition);
    this.check(expr.body);
    this.check(expr.elseBranch);
  }

  public visitBinaryExpression(expr: BoundBinaryExpression): void {
    this.check(expr.left);
    this.check(expr.right);
    this.assert(expr.left, expr.left.type, expr.operator.leftType);
    this.assert(expr.right, expr.right.type, expr.operator.rightType);
  }

  public visitParenthesizedExpression(expr: BoundParenthesizedExpression): void {
    this.check(expr.expression);
  }

  public visitArrayLiteralExpression(expr: BoundArrayLiteralExpression): void {
    for (const element of expr.elements) {
      this.check(element);
      this.assert(element, element.type, expr.type.elementType);
    }
  }

  public visitLiteralExpression(): void {
    // do nothing
  }

  public check<T extends BoundExpression | BoundStatement = BoundExpression | BoundStatement>(statements: T | BoundStatement[]): void {
    if (statements instanceof Array)
      for (const statement of statements)
        this.check(statement);
    else
      statements.accept(this);
  }

  private assert(node: BoundNode, a: Type, b: Type, message?: string): void {
    if (a.isAssignableTo(b)) return;
    throw new TypeError(message ?? `Type '${a.toString()}' is not assignable to type '${b.toString()}'`, node.token);
  }
}