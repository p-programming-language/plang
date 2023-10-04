import SingularType from "./singular-type";
import { Type, TypeKind } from "./type";

export default class ArrayType extends SingularType {
  public override readonly kind = TypeKind.Array;

  public constructor(
    public readonly elementType: Type
  ) { super("Array"); }

  public toString(): string {
    return `Array<${this.elementType.toString()}>`;
  }
}