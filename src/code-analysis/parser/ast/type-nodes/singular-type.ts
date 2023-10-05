import { Token } from "../../../syntax/token";
import AST from "..";

export class SingularTypeExpression extends AST.TypeRef {
  public constructor(
    public readonly name: Token<undefined>,
    public readonly typeArguments?: AST.TypeRef[]
  ) { super(); }

  public get isGeneric(): boolean {
    if (!this.typeArguments) return false;
    return this.typeArguments.length > 0;
  }

  public get token(): Token<undefined> {
    return this.name;
  }
}