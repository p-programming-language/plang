import { BoundExpression } from "../bound-node";
import type { Token } from "../../tokenization/token";
import type SingularType from "../../type-checker/types/singular-type";
import UnionType from "../../type-checker/types/union-type";
import AST from "../../parser/ast";

export default class BoundTernaryExpression extends BoundExpression {
  public override readonly type = new UnionType([<SingularType>this.body.type, <SingularType>this.elseBranch.type]);

  public constructor(
    public readonly token: Token,
    public readonly condition: BoundExpression,
    public readonly body: BoundExpression,
    public readonly elseBranch: BoundExpression
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundExpression<R>): R {
    return visitor.visitTernaryExpression(this);
  }
}