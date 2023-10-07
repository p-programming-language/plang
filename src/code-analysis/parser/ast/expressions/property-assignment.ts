import { Token } from "../../../tokenization/token";
import { AccessExpression } from "./access";
import AST from "..";

export class PropertyAssignmentExpression extends AST.Expression {
  public constructor(
    public readonly access: AccessExpression,
    public readonly value: AST.Expression
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Expression<R>): R {
    return visitor.visitPropertyAssignmentExpression(this);
  }

  public get token(): Token {
    return this.access.token;
  }
}