import { Type } from "./type";
import type SingularType from "./singular-type";
import TypeKind from "./type-kind";

export default class IntersectionType extends Type {
  public override readonly kind = TypeKind.Intersection;

  public constructor(
    public readonly types: SingularType[]
  ) { super(); }

  public toString(colors?: boolean): string {
    return [...new Set(this.types.map(t => t.toString(colors)))]
      .join(" & ");
  }
}