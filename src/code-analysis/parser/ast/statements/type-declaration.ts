import { Token } from "../../../tokenization/token";
import type Syntax from "../../../tokenization/syntax-type";
import AST from "..";

export class TypeDeclarationStatement extends AST.Statement {
  public constructor(
    public readonly name: Token<undefined, Syntax.Identifier>,
    public readonly typeRef: AST.TypeRef
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Statement<R>): R {
    return visitor.visitTypeDeclarationStatement(this);
  }

  public get token(): Token {
    return this.name;
  }
}