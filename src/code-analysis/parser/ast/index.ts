import util from "util";

import { Token } from "../../syntax/token";
import { LiteralExpression } from "./expressions/literal";
import { ParenthesizedExpression } from "./expressions/parenthesized";
import { BinaryExpression } from "./expressions/binary";
import { UnaryExpression } from "./expressions/unary";
import { IdentifierExpression } from "./expressions/identifier";

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

    }
  }
}

export default AST;