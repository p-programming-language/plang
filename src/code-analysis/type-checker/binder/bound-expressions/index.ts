import { BoundExpression } from "../bound-node";
import type { Token } from "../../../syntax/token";
import SingularType from "../../types/singular-type";
import AST from "../../../parser/ast";

export default class BoundIndexExpression extends BoundExpression {
  public override readonly type = this.object.type.isArray() ? this.object.type.elementType : new SingularType("undefined");

  public constructor(
    public readonly token: Token<undefined>,
    public readonly object: BoundExpression,
    public readonly index: BoundExpression
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundExpression<R>): R {
    return visitor.visitIndexExpression(this);
  }
}