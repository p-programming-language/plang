import { BoundExpression } from "../bound-node";
import type { Token } from "../../tokenization/token";
import type LiteralType from "../../type-checker/types/literal-type";
import type InterfaceType from "../../type-checker/types/interface-type";
import AST from "../../parser/ast";

export default class BoundObjectLiteralExpression extends BoundExpression {
  public constructor(
    public readonly token: Token<undefined>,
    public readonly properties: Map<LiteralType<string> | BoundExpression, BoundExpression>,
    public readonly type: InterfaceType
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundExpression<R>): R {
    return visitor.visitObjectLiteralExpression(this);
  }
}