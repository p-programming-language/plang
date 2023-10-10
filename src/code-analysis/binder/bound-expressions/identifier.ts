import { BoundExpression } from "../bound-node";
import type { Type } from "../../type-checker/types/type";
import type { Token } from "../../tokenization/token";
import type Syntax from "../../tokenization/syntax-type";
import type AST from "../../parser/ast";

export default class BoundIdentifierExpression<T extends Type = Type> extends BoundExpression {
  public constructor(
    public readonly name: Token<undefined, Syntax.Identifier>,
    public readonly type: T
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundExpression<R>): R {
    return visitor.visitIdentifierExpression(this);
  }

  public get token(): Token<undefined, Syntax.Identifier> {
    return this.name;
  }
}