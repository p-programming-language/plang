import { BoundExpression } from "../bound-node";
import type { Token } from "../../../tokenization/token";
import type InterfaceType from "../../types/interface-type";
import AST from "../../../parser/ast";

export default class BoundObjectLiteralExpression extends BoundExpression {
  public constructor(
    public readonly token: Token<undefined>,
    public readonly properties: Map<BoundExpression, BoundExpression>,
    public readonly type: InterfaceType
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundExpression<R>): R {
    return visitor.visitObjectLiteralExpression(this);
  }
}