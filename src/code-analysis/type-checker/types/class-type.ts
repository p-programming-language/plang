import type { Type } from "./type";
import type { ClassMemberSignature } from "..";
import type LiteralType from "./literal-type";
import type InterfaceType from "./interface-type";
import TypeKind from "./type-kind";
import SingularType from "./singular-type";

export default class ClassType extends SingularType {
  public override readonly kind = TypeKind.Class;

  public constructor(
    name: string,
    public readonly members: Map<LiteralType<string>, ClassMemberSignature<Type>>,
    // public readonly typeParameters?: TypeParameter[]
  ) { super(name); }

  public toString(): string {
    return `class ${this.name}`;
  }
}