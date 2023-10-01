import { Token } from "../../../syntax/token";
import { ValueType } from "../../../type-checker";
import AST from "..";

export class LiteralExpression<T extends ValueType = ValueType> extends AST.Expression {
  public constructor(
    public readonly token: Token<T>
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Expression<R>): R {
    return visitor.visitLiteralExpression(this);
  }
}