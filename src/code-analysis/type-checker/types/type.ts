import util from "util";

import type SingularType from "./singular-type";
import type UnionType from "./union-type";
import type ArrayType from "./array-type";
import type FunctionType from "./function-type";

export const enum TypeKind {
  Singular,
  Union,
  Array,
  Function
}

export abstract class Type {
  protected readonly abstract kind: TypeKind;

  public isSingular(): this is SingularType {
    return this.kind === TypeKind.Singular
      || this.kind === TypeKind.Array;
  }

  public isUnion(): this is UnionType {
    return this.kind === TypeKind.Union;
  }

  public isArray(): this is ArrayType {
    return this.kind === TypeKind.Array;
  }

  public isFunction(): this is FunctionType {
    return this.kind === TypeKind.Function;
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
    else if (this.isArray()) {
      if (!other.isArray()) return false;
      return this.elementType.isAssignableTo(other.elementType);
    } else if (this.isFunction()) {
      if (!other.isFunction()) return false;

      const parametersAreAssignable = Array.from(this.parameterTypes.entries())
        .every(([key, paramType]) => other.parameterTypes.has(key) && paramType.isAssignableTo(other.parameterTypes.get(key)!));

      return parametersAreAssignable && this.returnType.isAssignableTo(other.returnType);
    }

    return false;
  }

  public toString(): string {
    return util.inspect(this, { colors: true, compact: false })
  }
}