import type { Token } from "../../../tokenization/token";
import type { TypeLiteralValueType, TypeNameSyntax } from "../../../type-checker";
import { SingularTypeExpression } from "./singular-type";

export class LiteralTypeExpression<V extends TypeLiteralValueType = TypeLiteralValueType, S extends TypeNameSyntax = TypeNameSyntax> extends SingularTypeExpression {
  public constructor(
    public readonly literalToken: Token<V, S>
  ) { super(literalToken); }
}