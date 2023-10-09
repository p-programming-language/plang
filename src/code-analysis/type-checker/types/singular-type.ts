import { Type, TypeKind } from "./type";

export default class SingularType<Name extends string = string> extends Type {
  public override readonly kind: TypeKind = TypeKind.Singular;

  public constructor(
    public readonly name: Name,
    public readonly typeArguments?: Type[]
  ) { super(); }

  public toString(colors?: boolean): string {
    return this.name + (this.typeArguments ? `<${this.typeArguments.map(t => t.toString(colors)).join(", ")}>` : "");
  }
}