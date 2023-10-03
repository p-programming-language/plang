import util from "util";

import type { Token } from "../../syntax/token";
import type { LiteralExpression } from "./expressions/literal";
import type { ParenthesizedExpression } from "./expressions/parenthesized";
import type { BinaryExpression } from "./expressions/binary";
import type { UnaryExpression } from "./expressions/unary";
import type { IdentifierExpression } from "./expressions/identifier";
import type { VariableDeclarationStatement } from "./statements/variable-declaration";
import type BoundLiteralExpression from "../../type-checker/binder/bound-expressions/literal";
import type BoundParenthesizedExpression from "../../type-checker/binder/bound-expressions/parenthesized";
import type BoundBinaryExpression from "../../type-checker/binder/bound-expressions/binary";
import type BoundUnaryExpression from "../../type-checker/binder/bound-expressions/unary";
import type BoundIdentifierExpression from "../../type-checker/binder/bound-expressions/identifier";
import type BoundVariableDeclarationStatement from "../../type-checker/binder/bound-statements/variable-declaration";

namespace AST {
  export abstract class Node {
    public abstract get token(): Token;

    public toString(): string {
      return util.inspect(this, { colors: true, compact: false });
    }
  }

  export abstract class Expression extends Node {
    abstract accept<R>(visitor: Visitor.Expression<R>): R
  }
  export abstract class Statement extends Node {
    abstract accept<R>(visitor: Visitor.Statement<R>): R
  }

  export namespace Visitor {
    export abstract class Expression<R> {
      public abstract visitIdentifierExpression(expr: IdentifierExpression): R
      public abstract visitParenthesizedExpression(expr: ParenthesizedExpression): R
      public abstract visitLiteralExpression(expr: LiteralExpression): R
      public abstract visitBinaryExpression(expr: BinaryExpression): R
      public abstract visitUnaryExpression(expr: UnaryExpression): R
    }

    export abstract class Statement<R> {
      public abstract visitVariableDeclarationStatement(stmt: VariableDeclarationStatement): R
    }

    export abstract class BoundExpression<R> {
      public abstract visitIdentifierExpression(expr: BoundIdentifierExpression): R
      public abstract visitParenthesizedExpression(expr: BoundParenthesizedExpression): R
      public abstract visitLiteralExpression(expr: BoundLiteralExpression): R
      public abstract visitBinaryExpression(expr: BoundBinaryExpression): R
      public abstract visitUnaryExpression(expr: BoundUnaryExpression): R
    }

    export abstract class BoundStatement<R> {
      public abstract visitVariableDeclarationStatement(stmt: BoundVariableDeclarationStatement): R
    }
  }
}

export default AST;