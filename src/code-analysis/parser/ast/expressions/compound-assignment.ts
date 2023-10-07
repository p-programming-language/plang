import { Token } from "../../../tokenization/token";
import { IdentifierExpression } from "./identifier";
import { AccessExpression } from "./access";
import AST from "..";

export class CompoundAssignmentExpression extends AST.Expression {
  public constructor(
    public readonly left: IdentifierExpression | AccessExpression,
    public readonly right: AST.Expression,
    public readonly operator: Token<undefined>
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Expression<R>): R {
    return visitor.visitCompoundAssignmentExpression(this);
  }

  public get token(): Token {
    return this.left.token;
  }
}