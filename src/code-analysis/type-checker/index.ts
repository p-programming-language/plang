import assert from "assert";

import AST from "../parser/ast";
import BoundParenthesizedExpression from "./binder/bound-expressions/parenthesized";
import BoundBinaryExpression from "./binder/bound-expressions/binary";
import BoundUnaryExpression from "./binder/bound-expressions/unary";
import BoundIdentifierExpression from "./binder/bound-expressions/identifier";
import BoundVariableDeclarationStatement from "./binder/bound-statements/variable-declaration";
import BoundCompoundAssignmentExpression from "./binder/bound-expressions/compound-assignment";
import BoundVariableAssignmentExpression from "./binder/bound-expressions/variable-assignment";
import BoundVariableAssignmentStatement from "./binder/bound-statements/variable-assignment";
import BoundExpressionStatement from "./binder/bound-statements/expression";
import { TypeError } from "../../errors";
import { BoundExpression, BoundStatement } from "./binder/bound-node";
import { Type } from "./types/type";

export type ValueType = string | number | boolean | null | undefined;

export class TypeChecker implements AST.Visitor.BoundExpression<void>, AST.Visitor.BoundStatement<void> {
  public visitVariableDeclarationStatement(stmt: BoundVariableDeclarationStatement): void {
    if (!stmt.initializer) return;
    this.assert(stmt.initializer.type, stmt.symbol.type);
  }

  public visitVariableAssignmentStatement(stmt: BoundVariableAssignmentStatement): void {
    this.assert(stmt.value.type, stmt.symbol.type);
  }

  public visitExpressionStatement(stmt: BoundExpressionStatement): void {
    this.check(stmt.expression);
  }

  public visitVariableAssignmentExpression(expr: BoundVariableAssignmentExpression): void {
    this.assert(expr.value.type, expr.symbol.type);
  }

  public visitCompoundAssignmentExpression(expr: BoundCompoundAssignmentExpression): void {
    this.assert(expr.left.type, expr.operator.leftType);
    this.assert(expr.right.type, expr.operator.rightType);
  }

  public visitIdentifierExpression(expr: BoundIdentifierExpression): void {
    // do nothing
  }

  public visitUnaryExpression(expr: BoundUnaryExpression): void {
    this.assert(expr.operand.type, expr.operator.operandType);
  }

  public visitBinaryExpression(expr: BoundBinaryExpression): void {
    this.assert(expr.left.type, expr.operator.leftType);
    this.assert(expr.right.type, expr.operator.rightType);
  }

  public visitParenthesizedExpression(expr: BoundParenthesizedExpression): void {
    this.check(expr);
  }

  public visitLiteralExpression(): void {
    // do nothing
  }

  public check<T extends BoundExpression | BoundStatement = BoundExpression | BoundStatement>(statements: T | BoundStatement[]): void {
    if (statements instanceof Array)
      for (const statement of statements)
        this.check(statement);
    else
      statements.accept(this)
  }

  private assert(a: Type, b: Type): void {
    assert(a.isAssignableTo(b), new TypeError(`Type '${a.toString()}' is not assignable to '${b.toString()}'`));
  }
}

