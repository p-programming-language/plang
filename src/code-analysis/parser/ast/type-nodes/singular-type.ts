import { Token } from "../../../syntax/token";
import AST from "..";

export class SingularTypeExpression extends AST.TypeNode {
  public constructor(
    public readonly name: Token<undefined>,
    public readonly typeArguments?: AST.TypeNode[]
  ) { super(); }

  public get isGeneric(): boolean {
    if (!this.typeArguments) return false;
    return this.typeArguments.length > 0;
  }

  public get token(): Token<undefined> {
    return this.name;
  }
}