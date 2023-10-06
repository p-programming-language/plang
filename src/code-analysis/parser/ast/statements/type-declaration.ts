import { Token } from "../../../tokenization/token";
import AST from "..";

export class TypeDeclarationStatement extends AST.Statement {
  public constructor(
    public readonly name: Token<undefined>,
    public readonly typeRef: AST.TypeRef
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Statement<R>): R {
    return visitor.visitTypeDeclarationStatement(this);
  }

  public get token(): Token {
    return this.name;
  }
}