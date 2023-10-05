import { TypeError } from "../../errors";
import { BoundExpression, BoundNode, BoundStatement } from "./binder/bound-node";
import { Type } from "./types/type";
import AST from "../parser/ast";

import BoundParenthesizedExpression from "./binder/bound-expressions/parenthesized";
import BoundBinaryExpression from "./binder/bound-expressions/binary";
import BoundUnaryExpression from "./binder/bound-expressions/unary";
import BoundCompoundAssignmentExpression from "./binder/bound-expressions/compound-assignment";
import BoundVariableAssignmentExpression from "./binder/bound-expressions/variable-assignment";
import BoundExpressionStatement from "./binder/bound-statements/expression";
import BoundPrintlnStatement from "./binder/bound-statements/println";
import BoundVariableAssignmentStatement from "./binder/bound-statements/variable-assignment";
import BoundVariableDeclarationStatement from "./binder/bound-statements/variable-declaration";
import BoundArrayLiteralExpression from "./binder/bound-expressions/array-literal";
import BoundBlockStatement from "./binder/bound-statements/block";
import BoundIfStatement from "./binder/bound-statements/if";

export type ValueType = string | number | boolean | null | undefined | void | ValueType[];

export class TypeChecker implements AST.Visitor.BoundExpression<void>, AST.Visitor.BoundStatement<void> {
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
    this.assert(stmt.initializer, stmt.initializer.type, stmt.symbol.type);
  }

  public visitVariableAssignmentStatement(stmt: BoundVariableAssignmentStatement): void {
    this.assert(stmt.value, stmt.value.type, stmt.symbol.type);
  }

  public visitPrintlnStatement(stmt: BoundPrintlnStatement): void {
    for (const expression of stmt.expressions)
      this.check(expression);
  }

  public visitExpressionStatement(stmt: BoundExpressionStatement): void {
    this.check(stmt.expression);
  }

  public visitVariableAssignmentExpression(expr: BoundVariableAssignmentExpression): void {
    this.assert(expr.value, expr.value.type, expr.symbol.type);
  }

  public visitCompoundAssignmentExpression(expr: BoundCompoundAssignmentExpression): void {
    this.assert(expr.left, expr.left.type, expr.operator.leftType);
    this.assert(expr.right, expr.right.type, expr.operator.rightType);
    this.assert(expr.left, expr.left.type, expr.right.type);
  }

  public visitIdentifierExpression(): void {
    // do nothing
  }

  public visitUnaryExpression(expr: BoundUnaryExpression): void {
    this.assert(expr.operand, expr.operand.type, expr.operator.operandType);
  }

  public visitBinaryExpression(expr: BoundBinaryExpression): void {
    this.assert(expr.left, expr.left.type, expr.operator.leftType);
    this.assert(expr.right, expr.right.type, expr.operator.rightType);
  }

  public visitParenthesizedExpression(expr: BoundParenthesizedExpression): void {
    this.check(expr.expression);
  }

  public visitArrayLiteralExpression(expr: BoundArrayLiteralExpression): void {
    for (const element of expr.elements)
      this.assert(element, element.type, expr.type.elementType);
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

  private assert(node: BoundNode, a: Type, b: Type): void {
    if (a.isAssignableTo(b)) return;
    throw new TypeError(`Type '${a.toString()}' is not assignable to type '${b.toString()}'`, node.token);
  }
}