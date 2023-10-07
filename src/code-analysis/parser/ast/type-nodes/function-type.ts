import type { Token } from "../../../tokenization/token";
import type { TypeLiteralValueType } from "../../../type-checker";
import { SingularTypeExpression } from "./singular-type";
import { fakeToken } from "../../../../utility";
import type AST from "..";
import Syntax from "../../../tokenization/syntax-type";

export class FunctionTypeExpression extends SingularTypeExpression {
  public constructor(
    public readonly parameterTypes: Map<string, AST.TypeRef>,
    public readonly returnType: AST.TypeRef,
    // public readonly typeParameters?: TypeParameter[]
  ) {

    const typeKeyword = fakeToken<undefined, Syntax.Identifier>(Syntax.Identifier, "Function");
    super(typeKeyword);
  }

  public get token(): Token<TypeLiteralValueType | undefined> {
    return super.token;
  }
}