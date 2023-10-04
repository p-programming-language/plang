import { Token } from "../../../syntax/token";
import AST from "..";

export class SingularTypeExpression extends AST.TypeNode {
  public constructor(
    public readonly token: Token<undefined>
  ) { super(); }
}