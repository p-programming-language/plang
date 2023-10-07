import type { ValueType } from "..";
import { Type, TypeKind } from "./type";

export default class SingularType<Name extends string = string> extends Type {
  public override readonly kind: TypeKind = TypeKind.Singular;

  public constructor(
    public readonly name: Name,
    public readonly typeArguments?: Type[]
  ) { super(); }

  public static fromValue(value: ValueType): SingularType {
    switch(typeof value) {
      case "number": {
        if (value !== Math.floor(value))
          return new SingularType("float");
        else
          return  new SingularType("int");
      }

      case "boolean":
        return new SingularType("bool");

      default:
        return new SingularType(typeof value);
    }
  }

  public toString(colors?: boolean): string {
    return this.name + (this.typeArguments ? `<${this.typeArguments.map(t => t.toString(colors)).join(", ")}>` : "");
  }
}