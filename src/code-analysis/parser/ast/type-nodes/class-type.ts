import type { Token } from "../../../tokenization/token";
import type { ClassMemberSignature } from "../../../type-checker";
import type { LiteralExpression } from "../expressions/literal";
import type Syntax from "../../../tokenization/syntax-type";
import AST from "..";

export class ClassTypeExpression extends AST.TypeRef {
  public constructor(
    public readonly name: Token<undefined, Syntax.Identifier>,
    public readonly members: Map<LiteralExpression<string>, ClassMemberSignature<AST.TypeRef>>,
    // public readonly typeParameters?: TypeParameterExpression[]
  ) { super(); }

  public get token(): Token {
    return this.name;
  }
}