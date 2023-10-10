import type { Type } from "./type";
import type { ClassMemberSignature } from "..";
import type LiteralType from "./literal-type";
import TypeKind from "./type-kind";
import SingularType from "./singular-type";
import InterfaceType from "./interface-type";

export default class ClassType extends SingularType {
  public override readonly kind = TypeKind.Class;

  public constructor(
    name: string,
    public readonly members: Map<LiteralType<string>, ClassMemberSignature<Type>>,
    public readonly mixinTypes: Type[],
    public readonly superclassType?: Type
    // public readonly typeParameters?: TypeParameter[]
  ) { super(name); }

  public getInstanceType(): InterfaceType {
    return new InterfaceType(
      new Map(
        Array.from(this.members.entries())
          .filter(([_, sig]) => sig.modifiers.length === 0) // all public instance-level signatures (not private, non protected, not static)
          .map(([name, sig]) => [name, {
            valueType: sig.valueType,
            mutable: sig.mutable
          }])
      ),
      new Map
    )
  }

  public toString(): string {
    return `class ${this.name}`;
  }
}