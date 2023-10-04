import { Location, LocationSpan, Token } from "../../../syntax/token";
import { SingularTypeExpression } from "./singular-type";
import Syntax from "../../../syntax/syntax-type";
import AST from "..";

export class ArrayTypeExpression extends SingularTypeExpression {
  public constructor(
    public readonly elementType: AST.TypeNode
  ) {

    const pseudoLocation = new LocationSpan(new Location(1, 1), new Location(1, 1));
    const typeKeyword = new Token(Syntax.Identifier, "Array", undefined, pseudoLocation);
    super(typeKeyword, [elementType]);
  }

  public get token(): Token<undefined> {
    return super.token;
  }
}