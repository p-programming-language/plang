import { BoundExpression } from "../bound-node";
import type { Token } from "../../../syntax/token";
import ArrayType from "../../types/array-type";
import AST from "../../../parser/ast";

export default class BoundArrayLiteralExpression extends BoundExpression {
  public constructor(
    public readonly elements: BoundExpression[],
    public readonly type: ArrayType
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundExpression<R>): R {
    return visitor.visitArrayLiteralExpression(this);
  }

  public get token(): Token {
    return this.elements[0].token;
  }
}