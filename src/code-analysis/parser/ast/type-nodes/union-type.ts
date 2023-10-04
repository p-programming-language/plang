import type { Token } from "../../../syntax/token";
import type { SingularTypeExpression } from "./singular-type";
import type { ArrayTypeExpression } from "./array-type";
import AST from "..";

export class UnionTypeExpression extends AST.TypeNode {
  public constructor(
    public readonly types: (SingularTypeExpression | ArrayTypeExpression)[]
  ) { super(); }

  public get token(): Token {
    return this.types[0].token;
  }
}