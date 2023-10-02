import { TYPE_KEYWORDS } from "../../syntax/keywords";
import { Type, TypeKind } from "./type";

export default class SingularType extends Type {
  public override readonly kind = TypeKind.Singular;

  public constructor(
    public readonly name: keyof typeof TYPE_KEYWORDS
  ) { super(); }
}