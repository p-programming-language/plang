import { TypeError } from "../../errors";
import { BoundExpression, BoundNode, BoundStatement } from "../binder/bound-node";
import { INDEX_TYPE, INDEXABLE_LITERAL_TYPES } from "./types/type-sets";
import type { Token } from "../tokenization/token";
import type { Type } from "./types/type";
import type PValue from "../../runtime/values/value";
import FunctionType from "./types/function-type";
import InterfaceType from "./types/interface-type";
import SingularType from "./types/singular-type";
import LiteralType from "./types/literal-type";
import UnionType from "./types/union-type";
import ArrayType from "./types/array-type";
import Syntax from "../tokenization/syntax-type";
import AST from "../parser/ast";

import type BoundStringInterpolationExpression from "../binder/bound-expressions/string-interpolation";
import type BoundRangeLiteralExpression from "../binder/bound-expressions/range-literal";
import BoundArrayLiteralExpression from "../binder/bound-expressions/array-literal";
import type BoundObjectLiteralExpression from "../binder/bound-expressions/object-literal";
import type BoundParenthesizedExpression from "../binder/bound-expressions/parenthesized";
import type BoundUnaryExpression from "../binder/bound-expressions/unary";
import type BoundBinaryExpression from "../binder/bound-expressions/binary";
import type BoundTernaryExpression from "../binder/bound-expressions/ternary";
import type BoundCompoundAssignmentExpression from "../binder/bound-expressions/compound-assignment";
import type BoundVariableAssignmentExpression from "../binder/bound-expressions/variable-assignment";
import type BoundPropertyAssignmentExpression from "../binder/bound-expressions/property-assignment";
import type BoundCallExpression from "../binder/bound-expressions/call";
import type BoundAccessExpression from "../binder/bound-expressions/access";
import type BoundIsExpression from "../binder/bound-expressions/is";
import type BoundTypeOfExpression from "../binder/bound-expressions/typeof";
import type BoundIsInExpression from "../binder/bound-expressions/is-in";
import type BoundNewExpression from "../binder/bound-expressions/new";
import type BoundExpressionStatement from "../binder/bound-statements/expression";
import type BoundVariableAssignmentStatement from "../binder/bound-statements/variable-assignment";
import type BoundVariableDeclarationStatement from "../binder/bound-statements/variable-declaration";
import type BoundBlockStatement from "../binder/bound-statements/block";
import type BoundIfStatement from "../binder/bound-statements/if";
import type BoundWhileStatement from "../binder/bound-statements/while";
import type BoundFunctionDeclarationStatement from "../binder/bound-statements/function-declaration";
import type BoundReturnStatement from "../binder/bound-statements/return";
import type BoundEveryStatement from "../binder/bound-statements/every";
import type BoundClassBodyStatement from "../binder/bound-statements/class-body";
import type BoundClassDeclarationStatement from "../binder/bound-statements/class-declaration";
import type BoundMethodDeclarationStatement from "../binder/bound-statements/method-declaration";
import type BoundPropertyDeclarationStatement from "../binder/bound-statements/property-declaration";

export type ValueType = SingularValueType | ValueType[] | ObjectType;
export type TypeLiteralValueType = string | boolean | number;
export type SingularValueType = PValue | TypeLiteralValueType | null | undefined | void;
export type IndexValueType = string | number;
export interface ObjectType {
  [key: IndexValueType]: ValueType;
};

export type TypeNameSyntax = Syntax.Identifier | Syntax.Undefined | Syntax.Null | Syntax.String | Syntax.Int | Syntax.Float | Syntax.Boolean;
export type IndexType = SingularType<"string"> | SingularType<"int">;

export enum ModifierType {
  Public,
  Protected,
  Private,
  Static
}

export interface ClassMemberSignature<T> extends InterfaceMemberSignature<T> {
  readonly modifiers: ModifierType[];
}

export interface InterfaceMemberSignature<T> {
  readonly valueType: T;
  readonly mutable: boolean;
}

// NOTE: always call check() before assert()

export class TypeChecker implements AST.Visitor.BoundExpression<void>, AST.Visitor.BoundStatement<void> {
  public visitPackageStatement(): void {
    // do nothing
  }

  public visitMethodDeclarationStatement(stmt: BoundMethodDeclarationStatement): void {
    this.check(stmt.parameters);
    this.check(stmt.body);
    if (!stmt.body.type?.isAssignableTo(stmt.type.returnType))
      throw new TypeError(`Method '${stmt.name.lexeme}' is expected to return type '${stmt.type.returnType.toString()}', got '${stmt.body.type?.toString() ?? "void"}'`, stmt.name);
  }

  public visitPropertyDeclarationStatement(stmt: BoundPropertyDeclarationStatement): void {
    if (!stmt.initializer) return;
    this.check(stmt.initializer);

    if (stmt.initializer instanceof BoundArrayLiteralExpression && stmt.initializer.type.elementType.toString() === "undefined")
      return; // simply forgo the assertion if the array is empty, because an empty array will always be a Array<undefined>

    this.assert(stmt.initializer, stmt.initializer.type, stmt.type);
  }

  public visitClassBodyStatement(stmt: BoundClassBodyStatement): void {
    this.check(stmt.members);
  }

  public visitClassStatement(stmt: BoundClassDeclarationStatement): void {
    if (stmt.superclass)
      if (!stmt.superclass.isClass())
        throw new TypeError(`Cannot extend a class with value of type '${stmt.superclass.toString()}'`, stmt.keyword)
      else if (stmt.superclass === stmt.type)
        throw new TypeError(`Cannot extend class with itself`, stmt.keyword);

    if (stmt.mixins)
      for (const mixin of stmt.mixins)
        if (!mixin.isClass())
          throw new TypeError(`Cannot mixin a class with value of type '${mixin.toString()}'`, stmt.keyword)
        else if (mixin === stmt.type)
          throw new TypeError(`Cannot mixin class with itself`, stmt.keyword);

    this.check(stmt.body);
  }

  public visitEveryStatement(stmt: BoundEveryStatement): void {
    this.check(stmt.elementDeclarations);
    this.check(stmt.iterable);
    this.check(stmt.body);

    const iterableType = stmt.iterable.type;
    if (iterableType instanceof InterfaceType) {
      const [keyDecl, valueDecl] = stmt.elementDeclarations;
      const keyAssignable = Array.from<Type>(iterableType.members.keys())
        .concat(Array.from(iterableType.indexSignatures.keys()))
        .every(type => type.isAssignableTo(keyDecl.type));

      if (!keyAssignable)
        throw new TypeError(`Iterable key type is not assignable to '${keyDecl.type.toString()}'`, keyDecl.token);

      if (valueDecl) {
        const valueAssignable = Array.from(iterableType.members.values())
          .map(sig => sig.valueType)
          .concat(Array.from(iterableType.indexSignatures.values()))
          .every(type => type.isAssignableTo(valueDecl.type));

        if (!valueAssignable)
          throw new TypeError(`Iterable value type is not assignable to '${valueDecl.type.toString()}'`, valueDecl.token);
      }
    } else if (iterableType instanceof ArrayType) {
      const [valueDecl, indexDecl] = stmt.elementDeclarations;
      if (indexDecl) {
        const indexAssignable = indexDecl.type.isAssignableTo(new SingularType("int"));
        if (!indexAssignable)
          throw new TypeError(`'${indexDecl.type.toString()}' is not assignable to array index type, 'int'`, valueDecl.token);
      }

      const valueAssignable = valueDecl.type.isAssignableTo(iterableType.elementType);
      if (!valueAssignable)
        throw new TypeError(`Array value type is not assignable to '${valueDecl.type.toString()}'`, indexDecl.token);
    } else {
      const [declaration] = stmt.elementDeclarations;
      if (iterableType instanceof FunctionType) {
        const nextFunctionType = iterableType.returnType;
        const invalidIteratorMessage = `Invalid iterator function '${nextFunctionType.toString()}'`;
        if (!(nextFunctionType instanceof FunctionType))
          throw new TypeError(`${invalidIteratorMessage}: Iterators must return a function`, stmt.iterable.token);

        if (!new SingularType("undefined").isAssignableTo(nextFunctionType.returnType))
          throw new TypeError(`${invalidIteratorMessage}: Iterator next functions must have a nullable return type`, stmt.iterable.token);

        this.assert(declaration, declaration.type, nextFunctionType.returnType);
      } else {
        if (!iterableType.isAssignableTo(new UnionType([
          new SingularType("Range"),
          new SingularType("int"),
          new SingularType("string")
        ]))) {
          throw new TypeError(`'${iterableType.toString()}' is not a valid iterable type`, stmt.iterable.token);
        }
      }
    }
  }

  public visitNextStatement(): void {
    // do nothing
  }

  public visitBreakStatement(): void {
    // do nothing
  }

  public visitUseStatement(): void {
    // do nothing
  }

  public visitTypeDeclarationStatement(): void {
    // do nothing
  }

  public visitReturnStatement(stmt: BoundReturnStatement): void {
    this.check(stmt.expression);
  }

  public visitFunctionDeclarationStatement(stmt: BoundFunctionDeclarationStatement): void {
    this.check(stmt.parameters);
    this.check(stmt.body);
    if (!stmt.body.type?.isAssignableTo(stmt.type.returnType))
      throw new TypeError(`Function '${stmt.symbol.name.lexeme}' is expected to return type '${stmt.type.returnType.toString()}', got '${stmt.body.type?.toString() ?? "void"}'`, stmt.symbol.name);
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

  public visitExpressionStatement(stmt: BoundExpressionStatement): void {
    this.check(stmt.expression);
  }

  public visitNewExpression(expr: BoundNewExpression): void {
    this.check(expr.classRef);
    for (const arg of expr.constructorArgs)
      this.check(arg);

    const classType = expr.classRef.type;
    if (!classType.isClass())
      throw new TypeError("Cannot call 'new' on anything except a class", expr.token);

    const constructorType = Array.from(classType.getInstanceType().members.values())
      .map(sig => sig.valueType)
      .find((type): type is FunctionType => type.isFunction());

    if (constructorType) {
      const expectedTypes = Array.from(constructorType.parameterTypes.entries());
      for (const arg of expr.constructorArgs) {
        const [parameterName, expectedType] = expectedTypes[expr.constructorArgs.indexOf(arg)];
        this.check(arg);
        this.assert(arg, arg.type, expectedType, `Constructor argument type '${arg.type.toString()}' is not assignable to type '${expectedType.toString()}' of parameter '${parameterName}'`);
      }
    }
  }

  public visitIsInExpression(expr: BoundIsInExpression): void {
    this.check(expr.value);
    this.check(expr.object);
  }

  public visitIsExpression(expr: BoundIsExpression): void {
    this.check(expr.value);
  }

  public visitTypeOfExpression(expr: BoundTypeOfExpression): void {
    this.check(expr.value);
  }

  public visitIndexExpression(expr: BoundAccessExpression): void {
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

    if (!(expr.callee.type instanceof FunctionType))
      return;

    const expectedTypes = Array.from(expr.callee.type.parameterTypes.entries());
    for (const arg of expr.args) {
      const parameter = expectedTypes[expr.args.indexOf(arg)];
      if (!parameter) continue;
      const [parameterName, expectedType] = parameter;
      this.check(arg);
      this.assert(arg, arg.type, expectedType, `Argument type '${arg.type.toString()}' is not assignable to type '${expectedType.toString()}' of parameter '${parameterName}'`);
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
      if (key instanceof BoundExpression)
        this.check(key);

      this.check(value);
      if (key instanceof LiteralType) {
        const signature = this.getInterfacePropertySignature(expr.type, key, expr.token);
        this.assert(value, value.type, signature.valueType);
      } else {
        const valueType = key.type.isAssignableTo(INDEX_TYPE) && expr.type.indexSignatures.get(<SingularType<"string"> | SingularType<"int">>key.type);
        if (!valueType)
          throw new TypeError(`Index signature for '${key.type.toString()}' does not exist on '${expr.type.name}'`, key.token);

        this.assert(value, value.type, valueType);
      }
    }
  }

  private getInterfacePropertySignature(interfaceType: InterfaceType, propertyName: LiteralType<string>, token: Token): InterfaceMemberSignature<Type> {
    const valueType = interfaceType.members.get(propertyName);
    if (!valueType)
      throw new TypeError(`Property '${propertyName.value}' does not exist on '${interfaceType.name}'`, token);

    return valueType;
  }

  public visitArrayLiteralExpression(expr: BoundArrayLiteralExpression): void {
    for (const element of expr.elements) {
      this.check(element);
      this.assert(element, element.type, expr.type.elementType);
    }
  }

  public visitRangeLiteralExpression(expr: BoundRangeLiteralExpression): void {
    this.check(expr.minimum);
    this.check(expr.maximum);
  }

  public visitLiteralExpression(): void {
    // do nothing
  }

  public check<T extends BoundExpression | BoundStatement = BoundExpression | BoundStatement>(statements: T | (T extends BoundStatement ? T : BoundStatement)[]): void {
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