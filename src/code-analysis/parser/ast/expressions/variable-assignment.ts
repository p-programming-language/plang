import { Token } from "../../../tokenization/token";
import AST from "..";
import { IdentifierExpression } from "./identifier";

export class VariableAssignmentExpression extends AST.Expression {
  public constructor(
    public readonly identifier: IdentifierExpression,
    public readonly value: AST.Expression
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Expression<R>): R {
    return visitor.visitVariableAssignmentExpression(this);
  }

  public get token(): Token {
    return this.identifier.token;
  }
}