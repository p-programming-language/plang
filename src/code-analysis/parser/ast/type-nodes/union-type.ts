import type { Token } from "../../../syntax/token";
import type { SingularTypeExpression } from "./singular-type";
import AST from "..";

export class UnionTypeExpression extends AST.TypeRef {
  public constructor(
    public readonly types: SingularTypeExpression[]
  ) { super(); }

  public get token(): Token {
    return this.types[0].token;
  }
}