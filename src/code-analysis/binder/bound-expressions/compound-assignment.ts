import { BoundExpression } from "../bound-node";
import type { BoundBinaryOperator } from "../bound-operators/binary";
import type { Token } from "../../tokenization/token";
import type BoundIdentifierExpression from "./identifier";
import type BoundAccessExpression from "./access";
import AST from "../../parser/ast";

export default class BoundCompoundAssignmentExpression extends BoundExpression {
  public override readonly type = this.left.type;

  public constructor(
    public readonly left: BoundIdentifierExpression | BoundAccessExpression,
    public readonly right: BoundExpression,
    public readonly operator: BoundBinaryOperator
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundExpression<R>): R {
    return visitor.visitCompoundAssignmentExpression(this);
  }

  public get token(): Token {
    return this.left.token;
  }
}