import type { Token } from "../../../tokenization/token";
import type { LiteralExpression } from "../expressions/literal";
import type { SingularTypeExpression } from "./singular-type";
import AST from "..";

export class InterfaceTypeExpression extends AST.TypeRef {
  public constructor(
    public readonly name: Token<undefined>,
    public readonly properties: Map<LiteralExpression<string>, AST.TypeRef>,
    public readonly indexSignatures: Map<SingularTypeExpression<"string" | "int">, AST.TypeRef>
  ) { super(); }

  public get token(): Token {
    return this.name;
  }
}