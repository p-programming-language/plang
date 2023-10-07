import { Token } from "../../tokenization/token";
import { BoundExpression } from "../bound-node";
import BoundLiteralExpression from "./literal";
import SingularType from "../../type-checker/types/singular-type";
import AST from "../../parser/ast";

export default class BoundStringInterpolationExpression extends BoundExpression {
  public override readonly type = new SingularType("string");

  public constructor(
    public readonly parts: (BoundLiteralExpression<string> | BoundExpression)[]
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundExpression<R>): R {
    return visitor.visitStringInterpolationExpression(this);
  }

  public get token(): Token {
    return this.parts[0].token;
  }
}