import { Type, TypeKind } from "./type";
import type { IndexType, InterfacePropertySignature } from "..";
import type LiteralType from "./literal-type";
import SingularType from "./singular-type";

export default class InterfaceType extends SingularType {
  public override readonly kind = TypeKind.Interface;

  public constructor(
    public readonly properties: Map<LiteralType<string>, InterfacePropertySignature<Type>>,
    public readonly indexSignatures: Map<IndexType, Type>,
    // public readonly typeParameters?: TypeParameter[],
    name = "Object"
  ) { super(name); }

  public toString(colors?: boolean, indent = 0): string {
    let result = (this.name === "Object" ? "" : this.name + " ") + "{";
    if (this.indexSignatures.size > 0 || this.properties.size > 0)
      indent += 1;

    for (const [key, value] of this.indexSignatures) {
      result += "\n";
      result += "  ".repeat(indent);
      result += `[${key.toString()}]: ${value instanceof InterfaceType ? value.toString(colors, indent + 1) : value.toString()};`;
    }

    for (const [key, value] of this.properties) {
      result += "\n";
      result += "  ".repeat(indent);
      result += `${value instanceof InterfaceType ? value.toString(colors, indent + 1) : (value instanceof Type ? value.toString().replace(/\"/g, "") : value.valueType.toString())} ${key};`;
    }

    return result + "\n}";
  }
}