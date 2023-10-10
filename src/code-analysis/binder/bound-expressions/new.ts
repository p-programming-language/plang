import { BoundExpression } from "../bound-node";
import type { Token } from "../../tokenization/token";
import type { Type } from "../../type-checker/types/type";
import type Syntax from "../../tokenization/syntax-type";
import type BoundIdentifierExpression from "./identifier";
import AST from "../../parser/ast";

export default class BoundNewExpression extends BoundExpression {
  public override readonly type: Type;

  public constructor(
    public readonly token: Token<undefined, Syntax.New>,
    public readonly classRef: BoundIdentifierExpression,
    public readonly constructorArgs: BoundExpression[]
  ) {

    super();
    if (classRef.type.isClass())
      this.type = classRef.type.getInstanceType();
    else
      this.type = classRef.type;
  }

  public accept<R>(visitor: AST.Visitor.BoundExpression<R>): R {
    return visitor.visitNewExpression(this);
  }
}