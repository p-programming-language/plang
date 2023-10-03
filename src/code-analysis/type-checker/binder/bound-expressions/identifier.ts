import { BoundExpression } from "../bound-node";
import type { Type } from "../../types/type";
import AST from "../../../parser/ast";

export default class BoundIdentifierExpression extends BoundExpression {
  public constructor(
    public readonly name: string,
    public readonly type: Type
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundExpression<R>): R {
    return visitor.visitIdentifierExpression(this);
  }
}