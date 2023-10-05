import type { ValueType } from "../../../type-checker";
import type { Token } from "../../../syntax/token";
import type Syntax from "../../../syntax/syntax-type";
import AST from "..";

export class LiteralExpression<V extends ValueType = ValueType, S extends Syntax = Syntax> extends AST.Expression {
  public constructor(
    public readonly token: Token<V, S>
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Expression<R>): R {
    return visitor.visitLiteralExpression(this);
  }
}