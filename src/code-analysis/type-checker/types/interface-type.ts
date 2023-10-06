import { Type, TypeKind } from "./type";
import SingularType from "./singular-type";

export default class InterfaceType extends SingularType {
  public override readonly kind = TypeKind.Interface;

  public constructor(
    public readonly properties: Map<string, Type>,
    public readonly indexSignatures: Map<SingularType<"string"> | SingularType<"int">, Type>,
    name = "object"
    // public readonly typeParameters?: TypeParameter[]
  ) { super(name); }

  public toString(indent = 0): string {
    let result = "{";
    if (this.indexSignatures.size > 0 || this.properties.size > 0)
      indent += 1;

    for (const [key, value] of this.indexSignatures) {
      result += "\n";
      result += "  ".repeat(indent);
      result += `[${key.toString()}]: ${value instanceof InterfaceType ? value.toString(indent + 1) : value.toString()};`;
    }

    for (const [key, value] of this.properties) {
      result += "\n";
      result += "  ".repeat(indent);
      result += `${key}: ${value instanceof InterfaceType ? value.toString(indent + 1) : value.toString()};`;
    }

    return result + "\n}";
  }
}