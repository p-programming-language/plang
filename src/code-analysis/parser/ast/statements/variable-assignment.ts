import { Token } from "../../../tokenization/token";
import { IdentifierExpression } from "../expressions/identifier";
import AST from "..";

export class VariableAssignmentStatement extends AST.Statement {
  public constructor(
    public readonly identifier: IdentifierExpression, // | AccessExpression
    public readonly value: AST.Expression
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Statement<R>): R {
    return visitor.visitVariableAssignmentStatement(this);
  }

  public get token(): Token {
    return this.identifier.token;
  }
}