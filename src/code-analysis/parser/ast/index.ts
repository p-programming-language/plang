import util from "util";

import type { Token } from "../../syntax/token";
import type { LiteralExpression } from "./expressions/literal";
import type { ArrayLiteralExpression } from "./expressions/array-literal";
import type { ParenthesizedExpression } from "./expressions/parenthesized";
import type { BinaryExpression } from "./expressions/binary";
import type { UnaryExpression } from "./expressions/unary";
import type { IdentifierExpression } from "./expressions/identifier";
import type { CompoundAssignmentExpression } from "./expressions/compound-assignment";
import type { VariableAssignmentExpression } from "./expressions/variable-assignment";
import type { ExpressionStatement } from "./statements/expression";
import type { VariableAssignmentStatement } from "./statements/variable-assignment";
import type { VariableDeclarationStatement } from "./statements/variable-declaration";
import type BoundLiteralExpression from "../../type-checker/binder/bound-expressions/literal";
import type BoundArrayLiteralExpression from "../../type-checker/binder/bound-expressions/array-literal";
import type BoundParenthesizedExpression from "../../type-checker/binder/bound-expressions/parenthesized";
import type BoundBinaryExpression from "../../type-checker/binder/bound-expressions/binary";
import type BoundUnaryExpression from "../../type-checker/binder/bound-expressions/unary";
import type BoundIdentifierExpression from "../../type-checker/binder/bound-expressions/identifier";
import type BoundCompoundAssignmentExpression from "../../type-checker/binder/bound-expressions/compound-assignment";
import type BoundVariableAssignmentExpression from "../../type-checker/binder/bound-expressions/variable-assignment";
import type BoundExpressionStatement from "../../type-checker/binder/bound-statements/expression";
import type BoundVariableAssignmentStatement from "../../type-checker/binder/bound-statements/variable-assignment";
import type BoundVariableDeclarationStatement from "../../type-checker/binder/bound-statements/variable-declaration";

namespace AST {
  export abstract class Node {
    public abstract get token(): Token;

    public toString(): string {
      return util.inspect(this, { colors: true, compact: false });
    }
  }

  export abstract class TypeNode extends Node {}
  export abstract class Expression extends Node {
    abstract accept<R>(visitor: Visitor.Expression<R>): R
  }
  export abstract class Statement extends Node {
    abstract accept<R>(visitor: Visitor.Statement<R>): R
  }

  export namespace Visitor {
    export abstract class Expression<R> {
      public abstract visitVariableAssignmentExpression(expr: VariableAssignmentExpression): R
      public abstract visitCompoundAssignmentExpression(expr: CompoundAssignmentExpression): R
      public abstract visitIdentifierExpression(expr: IdentifierExpression): R
      public abstract visitParenthesizedExpression(expr: ParenthesizedExpression): R
      public abstract visitArrayLiteralExpression(expr: ArrayLiteralExpression): R
      public abstract visitLiteralExpression(expr: LiteralExpression): R
      public abstract visitBinaryExpression(expr: BinaryExpression): R
      public abstract visitUnaryExpression(expr: UnaryExpression): R
    }

    export abstract class Statement<R> {
      public abstract visitVariableDeclarationStatement(stmt: VariableDeclarationStatement): R
      public abstract visitVariableAssignmentStatement(stmt: VariableAssignmentStatement): R
      public abstract visitExpressionStatement(stmt: ExpressionStatement): R
    }

    export abstract class BoundExpression<R> {
      public abstract visitVariableAssignmentExpression(expr: BoundVariableAssignmentExpression): R
      public abstract visitCompoundAssignmentExpression(expr: BoundCompoundAssignmentExpression): R
      public abstract visitIdentifierExpression(expr: BoundIdentifierExpression): R
      public abstract visitParenthesizedExpression(expr: BoundParenthesizedExpression): R
      public abstract visitArrayLiteralExpression(expr: BoundArrayLiteralExpression): R
      public abstract visitLiteralExpression(expr: BoundLiteralExpression): R
      public abstract visitBinaryExpression(expr: BoundBinaryExpression): R
      public abstract visitUnaryExpression(expr: BoundUnaryExpression): R
    }

    export abstract class BoundStatement<R> {
      public abstract visitVariableDeclarationStatement(stmt: BoundVariableDeclarationStatement): R
      public abstract visitVariableAssignmentStatement(stmt: BoundVariableAssignmentStatement): R
      public abstract visitExpressionStatement(stmt: BoundExpressionStatement): R
    }
  }
}

export default AST;