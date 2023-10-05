import { Type, TypeKind } from "./type";
import type SingularType from "./singular-type";

export default class UnionType extends Type {
  public override readonly kind = TypeKind.Union;

  public constructor(
    public readonly types: SingularType[]
  ) { super(); }

  public toString(): string {
    return this.types
      .map(t => t.toString())
      .join(" | ")
      .replace(/ \| undefined/, "?");
  }
}