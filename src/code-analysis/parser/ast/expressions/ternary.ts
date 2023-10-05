import { Token } from "../../../syntax/token";
import AST from "..";

export class TernaryExpression extends AST.Expression {
  public constructor(
    public readonly token: Token,
    public readonly condition: AST.Expression,
    public readonly body: AST.Expression,
    public readonly elseBranch: AST.Expression
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Expression<R>): R {
    return visitor.visitTernaryExpression(this);
  }
}