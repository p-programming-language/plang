import util from "util";

import { TYPE_KEYWORDS } from "../../syntax/keywords";
import type SingularType from "./singular-type";
import type UnionType from "./union-type";
import type ArrayType from "./array-type";


export const enum TypeKind {
  Singular,
  Union,
  Array
}

export abstract class Type {
  protected readonly abstract kind: TypeKind;

  public isSingular(): this is SingularType {
    return this.kind === TypeKind.Singular;
  }

  public isUnion(): this is UnionType {
    return this.kind === TypeKind.Union;
  }

  public isArray(): this is ArrayType {
    return this.kind === TypeKind.Array;
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

export type TypeName = keyof typeof TYPE_KEYWORDS;
