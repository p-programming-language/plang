import { Token } from "../../../tokenization/token";
import AST from "..";
import Syntax from "../../../tokenization/syntax-type";

export class SingularTypeExpression<Name extends string = string> extends AST.TypeRef {
  public constructor(
    public readonly name: Token<undefined, Syntax.Identifier | Syntax.Undefined | Syntax.Null, Name>,
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