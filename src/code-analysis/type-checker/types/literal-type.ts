import util from "util";

import type { TypeLiteralValueType } from "..";
import TypeKind from "./type-kind";
import SingularType from "./singular-type";

export default class LiteralType<V extends TypeLiteralValueType = TypeLiteralValueType> extends SingularType {
  public override readonly kind = TypeKind.Literal;

  public constructor(
    public readonly value: V
  ) { super(util.inspect(value, { colors: false }).replace(/'/g, '"')); }

  public toString(colors?: boolean): string {
    return util.inspect(this.value, { colors }).replace(/'/g, '"');
  }
}