import { BoundExpression } from "../bound-node";
import type { Type } from "../../types/type";
import type { Token } from "../../../syntax/token";
import AST from "../../../parser/ast";

export default class BoundIdentifierExpression<T extends Type = Type> extends BoundExpression {
  public constructor(
    public readonly name: Token<undefined>,
    public readonly type: T
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundExpression<R>): R {
    return visitor.visitIdentifierExpression(this);
  }

  public get token(): Token {
    return this.name;
  }
}