import type { Token } from "../../../tokenization/token";
import type { ModifierType } from "../../../type-checker";
import type { IdentifierExpression } from "../expressions/identifier";
import AST from "..";

export class PropertyDeclarationStatement extends AST.Statement {
  public constructor(
    public readonly modifiers: ModifierType[],
    public readonly typeRef: AST.TypeRef,
    public readonly identifier: IdentifierExpression,
    public readonly mutable: boolean,
    public readonly initializer?: AST.Expression,
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Statement<R>): R {
    return visitor.visitPropertyDeclarationStatement(this);
  }

  public get token(): Token {
    return this.typeRef.token;
  }
}