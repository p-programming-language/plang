import util from "util";

import type { TypeLiteralValueType } from "..";
import { TypeKind } from "./type";
import SingularType from "./singular-type";

export default class LiteralType<V extends TypeLiteralValueType = TypeLiteralValueType> extends SingularType {
  public override readonly kind = TypeKind.Literal;

  public constructor(
    public readonly value: V
  ) { super(util.inspect(value).replace(/'/g, '"')); }

  public toString(): string {
    return util.inspect(this.value).replace(/'/g, '"');
  }
}