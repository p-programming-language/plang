import { Type, TypeKind } from "./type";
import SingularType from "./singular-type";

export default class UnionType extends Type {
  public override readonly kind = TypeKind.Union;

  public constructor(
    public readonly types: SingularType[]
  ) { super(); }
}