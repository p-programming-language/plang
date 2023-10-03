import { BoundExpression } from "../bound-node";
import type { Type } from "../../types/type";
import type { Token } from "../../../syntax/token";
import AST from "../../../parser/ast";

export default class BoundIdentifierExpression extends BoundExpression {
  public constructor(
    public readonly name: Token,
    public readonly type: Type
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundExpression<R>): R {
    return visitor.visitIdentifierExpression(this);
  }

  public get token(): Token {
    return this.name;
  }
}