import { Type, TypeKind, TypeName } from "./type";

export default class SingularType extends Type {
  public override readonly kind = TypeKind.Singular;

  public constructor(
    public readonly name: TypeName,
    public readonly typeArguments?: Type[]
  ) { super(); }

  public toString(): string {
    return this.name + (this.typeArguments ? `<${this.typeArguments.map(t => t.toString()).join(", ")}>` : "");
  }
}