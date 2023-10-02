import util from "util";
import type SingularType from "./singular-type";
import type UnionType from "./union-type";

export const enum TypeKind {
  Singular,
  Union
}

export abstract class Type {
  public readonly abstract kind: TypeKind;

  public isSingular(): this is SingularType {
    return this.kind === TypeKind.Singular;
  }

  public isUnion(): this is UnionType {
    return this.kind === TypeKind.Union;
  }

  public isAssignableTo(other: Type): boolean {
    if (this.isUnion())
      return this.types.some(type => type.isAssignableTo(other));
    else if (this.isSingular())
      if (other.isSingular()) {
        if (this.name === "any" || other.name === "any")
          return true;

        return this.name === other.name;
      } else
        return other.isAssignableTo(this);

    return false;
  }

  public toString(): string {
    return util.inspect(this, { colors: true, compact: false })
  }
}