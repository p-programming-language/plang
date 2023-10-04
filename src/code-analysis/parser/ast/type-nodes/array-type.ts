import { Token } from "../../../syntax/token";
import { SingularTypeExpression } from "./singular-type";
import { fakeToken } from "../../../../lib/utility";
import Syntax from "../../../syntax/syntax-type";
import AST from "..";

export class ArrayTypeExpression extends SingularTypeExpression {
  public constructor(
    public readonly elementType: AST.TypeNode
  ) {

    const typeKeyword = fakeToken<undefined>(Syntax.Identifier, "Array");
    super(typeKeyword, [elementType]);
  }

  public get token(): Token<undefined> {
    return super.token;
  }
}