import type { Token } from "../../../tokenization/token";
import type { TypeLiteralValueType, TypeNameSyntax } from "../../../type-checker";
import AST from "..";

export class SingularTypeExpression<Name extends string = string> extends AST.TypeRef {
  public constructor(
    public readonly name: Token<TypeLiteralValueType | undefined, TypeNameSyntax, Name>,
    public readonly typeArguments?: AST.TypeRef[]
  ) { super(); }

  public get isGeneric(): boolean {
    if (!this.typeArguments) return false;
    return this.typeArguments.length > 0;
  }

  public get token(): Token<TypeLiteralValueType | undefined> {
    return this.name;
  }
}