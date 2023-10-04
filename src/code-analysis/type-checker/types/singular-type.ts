import { Type, TypeKind } from "./type";

export default class SingularType extends Type {
  public override readonly kind: TypeKind = TypeKind.Singular;

  public constructor(
    public readonly name: string,
    public readonly typeArguments?: Type[]
  ) { super(); }

  public toString(): string {
    return this.name + (this.typeArguments ? `<${this.typeArguments.map(t => t.toString()).join(", ")}>` : "");
  }
}