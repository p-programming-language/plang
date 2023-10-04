import SingularType from "./singular-type";
import { Type, TypeKind, TypeName } from "./type";

export default class ArrayType extends Type {
  public override readonly kind = TypeKind.Array;

  public constructor(
    public readonly elementType: Type
  ) { super(); }

  public toString(): string {
    return this.elementType.toString();
  }
}