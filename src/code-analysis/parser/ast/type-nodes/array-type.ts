import type { Token } from "../../../tokenization/token";
import type { TypeLiteralValueType } from "../../../type-checker";
import { SingularTypeExpression } from "./singular-type";
import { fakeToken } from "../../../../utility";
import type AST from "..";
import Syntax from "../../../tokenization/syntax-type";

export class ArrayTypeExpression extends SingularTypeExpression {
  public constructor(
    public readonly elementType: AST.TypeRef
  ) {

    const typeKeyword = fakeToken<undefined, Syntax.Identifier>(Syntax.Identifier, "Array");
    super(typeKeyword, [elementType]);
  }

  public get token(): Token<TypeLiteralValueType | undefined> {
    return super.token;
  }
}