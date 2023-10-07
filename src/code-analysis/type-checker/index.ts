import { TypeError } from "../../errors";
import { BoundExpression, BoundNode, BoundStatement } from "../binder/bound-node";
import { INDEX_TYPE, INDEXABLE_LITERAL_TYPES } from "./types/type-sets";
import type { Token } from "../tokenization/token";
import type { Type } from "./types/type";
import type PValue from "../../runtime/values/value";
import type FunctionType from "./types/function-type";
import type InterfaceType from "./types/interface-type";
import ArrayType from "./types/array-type";
import SingularType from "./types/singular-type";
import UnionType from "./types/union-type";
import Syntax from "../tokenization/syntax-type";
import AST from "../parser/ast";

import BoundLiteralExpression from "../binder/bound-expressions/literal";
import BoundArrayLiteralExpression from "../binder/bound-expressions/array-literal";
import type BoundObjectLiteralExpression from "../binder/bound-expressions/object-literal";
import type BoundStringInterpolationExpression from "../binder/bound-expressions/string-interpolation";
import type BoundParenthesizedExpression from "../binder/bound-expressions/parenthesized";
import type BoundUnaryExpression from "../binder/bound-expressions/unary";
import type BoundBinaryExpression from "../binder/bound-expressions/binary";
import type BoundTernaryExpression from "../binder/bound-expressions/ternary";
import BoundIdentifierExpression from "../binder/bound-expressions/identifier";
import type BoundCompoundAssignmentExpression from "../binder/bound-expressions/compound-assignment";
import type BoundVariableAssignmentExpression from "../binder/bound-expressions/variable-assignment";
import type BoundPropertyAssignmentExpression from "../binder/bound-expressions/property-assignment";
import type BoundCallExpression from "../binder/bound-expressions/call";
import type BoundIndexExpression from "../binder/bound-expressions";
import type BoundExpressionStatement from "../binder/bound-statements/expression";
import type BoundPrintlnStatement from "../binder/bound-statements/println";
import type BoundVariableAssignmentStatement from "../binder/bound-statements/variable-assignment";
import type BoundVariableDeclarationStatement from "../binder/bound-statements/variable-declaration";
import type BoundBlockStatement from "../binder/bound-statements/block";
import type BoundIfStatement from "../binder/bound-statements/if";
import type BoundWhileStatement from "../binder/bound-statements/while";
import type BoundFunctionDeclarationStatement from "../binder/bound-statements/function-declaration";
import type BoundReturnStatement from "../binder/bound-statements/return";

export type ValueType = SingularValueType | ValueType[] | ObjectType;
export type SingularValueType = PValue | string | number | boolean | null | undefined | void;
export type IndexValueType = string | number;
export interface ObjectType {
  [key: IndexValueType]: ValueType;
};

export type IndexType = SingularType<"string"> | SingularType<"int">;

// NOTE: always call check() before assert()

export class TypeChecker implements AST.Visitor.BoundExpression<void>, AST.Visitor.BoundStatement<void> {
  public visitTypeDeclarationStatement(): void {
    // do nothing
  }

  public visitReturnStatement(stmt: BoundReturnStatement): void {
    this.check(stmt.expression);
  }

  public visitFunctionDeclarationStatement(stmt: BoundFunctionDeclarationStatement): void {
    this.check(stmt.parameters);
    this.check(stmt.body);
    if (stmt.body.type)
      this.assert(stmt.body, stmt.body.type, stmt.symbol.type.returnType);

    else if (!this.isUndefined(stmt.symbol.type.returnType))
      throw new TypeError(`Function '${stmt.symbol.name.lexeme}' is expected to return type '${stmt.symbol.type.returnType.toString()}', got 'void'`, stmt.symbol.name);
  }

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

    if (stmt.initializer instanceof BoundArrayLiteralExpression && stmt.initializer.type.elementType.toString() === "undefined")
      return; // simply forgo the assertion if the array is empty, because an empty array will always be a Array<undefined>

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

  public visitIndexExpression(expr: BoundIndexExpression): void {
    this.check(expr.object);
    this.check(expr.index);

    if (
      !expr.object.type.isAssignableTo(new ArrayType(new SingularType("any")))
      && !expr.object.type.isInterface()
      && !INDEXABLE_LITERAL_TYPES.some(type => expr.object.type.is(type))
    ) {
      throw new TypeError(`Attempt to index '${expr.object.type.toString()}'`, expr.object.token);
    }

    this.assert(expr.index, expr.index.type, INDEX_TYPE);
  }

  public visitCallExpression(expr: BoundCallExpression): void {
    this.check(expr.callee);

    const type = <FunctionType>expr.callee.type;
    const expectedTypes = Array.from(type.parameterTypes.values());
    for (const arg of expr.args) {
      this.check(arg);
      this.assert(arg, arg.type, expectedTypes[expr.args.indexOf(arg)]);
    }
  }

  public visitPropertyAssignmentExpression(expr: BoundPropertyAssignmentExpression): void {
    this.check(expr.access);
    this.check(expr.value);
    this.assert(expr.access, expr.access.type, expr.value.type);
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

  public visitStringInterpolationExpression(expr: BoundStringInterpolationExpression): void {
    for (const part of expr.parts)
      this.check(part);
  }

  public visitObjectLiteralExpression(expr: BoundObjectLiteralExpression): void {
    for (const [key, value] of expr.properties) {
      this.check(key);
      this.check(value);
      if (key instanceof BoundIdentifierExpression) {
        const propertyName = key.name.lexeme;
        const valueType = this.getValueType(expr.type, propertyName, key.name);
        this.assert(value, value.type, valueType);
      } else if (key instanceof BoundLiteralExpression && key.token.syntax === Syntax.String) {
        const propertyName: string = key.token.value;
        const valueType = this.getValueType(expr.type, propertyName, key.token);
        this.assert(value, value.type, valueType);
      } else {
        const valueType = key.type.isAssignableTo(INDEX_TYPE) && expr.type.indexSignatures.get(<SingularType<"string"> | SingularType<"int">>key.type);
        if (!valueType)
          throw new TypeError(`Index signature for '${key.type.toString()}' does not exist on '${expr.type.name}'`, key.token);

        this.assert(value, value.type, valueType);
      }
    }
  }

  private getValueType(interfaceType: InterfaceType, propertyName: string, token: Token): Type {
    const valueType = interfaceType.properties.get(propertyName);
    if (!valueType)
      throw new TypeError(`Property '${propertyName}' does not exist on '${interfaceType.name}'`, token);

    return valueType;
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

  private isUndefined(type: Type): boolean {
    return type.isAssignableTo(new UnionType([
      new SingularType("void"),
      new SingularType("undefined")
    ]));
  }

  private assert(node: BoundNode, a: Type, b: Type, message?: string): void {
    if (a.isAssignableTo(b)) return;
    throw new TypeError(message ?? `Type '${a.toString()}' is not assignable to type '${b.toString()}'`, node.token);
  }
}