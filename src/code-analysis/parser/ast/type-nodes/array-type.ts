import type { Token } from "../../../syntax/token";
import AST from "..";

export class ArrayTypeExpression extends AST.TypeNode {
  public constructor(
    public readonly elementType: AST.TypeNode
  ) { super(); }

  public get token(): Token {
    return this.elementType.token;
  }
}