import type { Type } from "./type";
import TypeKind from "./type-kind";
import SingularType from "./singular-type";

export default class ArrayType extends SingularType {
  public override readonly kind = TypeKind.Array;

  public constructor(
    public readonly elementType: Type
  ) { super("Array"); }

  public toString(colors?: boolean): string {
    return this.elementType.toString(colors) + "[]";
  }
}