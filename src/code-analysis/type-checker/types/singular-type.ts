import type { ValueType } from "..";
import { Range } from "../../../runtime/values/range";
import { Type } from "./type";
import type LiteralType from "./literal-type";
import TypeKind from "./type-kind";
import UnionType from "./union-type";

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

      default: {
        if (value instanceof Array) {
          let elementType: Type = new SingularType("undefined");
          for (const element of value) {
            const type = SingularType.fromValue(element);
            if (elementType.isUnion())
              elementType = new UnionType([...elementType.types, type]);
            else
              elementType = type;
          }

          return new SingularType("Array", [elementType]);
        } else if (value instanceof Range)
          return new SingularType("Range");

        return new SingularType(typeof value);
      }
    }
  }

  public static fromLiteral(literal: LiteralType): SingularType {
    return this.fromValue(literal.value);
  }

  public toString(colors?: boolean): string {
    return this.name + (this.typeArguments ? `<${this.typeArguments.map(t => t.toString(colors)).join(", ")}>` : "");
  }
}