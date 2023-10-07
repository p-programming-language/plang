import type { TypeLiteralValueType } from "../../../type-checker";
import type { Token } from "../../../tokenization/token";
import type Syntax from "../../../tokenization/syntax-type";
import AST from "..";

export class LiteralExpression<V extends TypeLiteralValueType | null | undefined = TypeLiteralValueType | null | undefined, S extends Syntax = Syntax> extends AST.Expression {
  public constructor(
    public readonly token: Token<V, S>
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Expression<R>): R {
    return visitor.visitLiteralExpression(this);
  }
}