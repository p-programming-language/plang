import { Type, TypeKind } from "./type";
import SingularType from "./singular-type";

export default class InterfaceType extends SingularType {
  public override readonly kind = TypeKind.Interface;

  public constructor(
    name: string,
    public readonly properties: Map<string, Type>,
    public readonly indexSignatures: Map<Type, Type>
    // public readonly typeParameters?: TypeParameter[]
  ) { super(name); }

  public toString(indent = 0): string {
    let result = "{";
    for (const [key, value] of this.indexSignatures) {
      result += "\n";
      result += "  ".repeat(indent);
      result += `[${key.toString()}]: ${value.toString()};`;
    }

    for (const [key, value] of this.properties) {
      result += "\n";
      result += "  ".repeat(indent);
      result += `${key}: ${value.toString()};`;
    }

    return result + "\n}";
  }
}