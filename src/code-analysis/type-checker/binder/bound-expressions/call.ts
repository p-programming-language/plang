import { BoundExpression } from "../bound-node";
import type { Token } from "../../../tokenization/token";
import type FunctionType from "../../types/function-type";
import type BoundIdentifierExpression from "./identifier";
import type BoundIndexExpression from ".";
import AST from "../../../parser/ast";

export default class BoundCallExpression extends BoundExpression {
  public override readonly type = (<FunctionType>this.callee.type)?.returnType;

  public constructor(
    public readonly callee: BoundIdentifierExpression<FunctionType> | BoundIndexExpression,
    public readonly args: BoundExpression[]
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundExpression<R>): R {
    return visitor.visitCallExpression(this);
  }

  public get token(): Token {
    return this.callee.token;
  }
}