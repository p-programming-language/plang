import { Type, TypeKind } from "./type";
import type SingularType from "./singular-type";
import type ArrayType from "./array-type";

export default class UnionType extends Type {
  public override readonly kind = TypeKind.Union;

  public constructor(
    public readonly types: (SingularType | ArrayType)[]
  ) { super(); }

  public toString(): string {
    return this.types.map(t => t.toString()).join(" | ");
  }
}