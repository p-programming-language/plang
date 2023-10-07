import util from "util";

import type { InterfacePropertySignature } from "..";
import SingularType from "./singular-type";
import type LiteralType from "./literal-type";
import type UnionType from "./union-type";
import type ArrayType from "./array-type";
import type FunctionType from "./function-type";
import type InterfaceType from "./interface-type";

export enum TypeKind {
  Singular,
  Literal,
  Union,
  Array,
  Function,
  Interface
}

export abstract class Type {
  protected readonly abstract kind: TypeKind;

  public isSingular(): this is SingularType {
    return this.kind === TypeKind.Singular
      || this.kind === TypeKind.Literal
      || this.kind === TypeKind.Array
      || this.kind === TypeKind.Interface;
  }

  public isLiteral(): this is LiteralType {
    return this.kind === TypeKind.Literal;
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

  public isInterface(): this is InterfaceType {
    return this.kind === TypeKind.Interface;
  }

  public isNullish(): this is SingularType<"void" | "undefined" | "null"> {
    return this.isSingular()
      && (this.name === "void"
      || this.name === "undefined"
      || this.name === "null");
  }

  public is(other: Type): boolean {
    if (this.isUnion())
      return this.types.every(type => type.is(other));

    return this.isAssignableTo(other);
  }

  public isAssignableTo(other: Type): boolean {
    if (other.isSingular() && other.name === "any")
      return true;

    if (this.isLiteral())
      return other.isLiteral() ? other.value === this.value : other.isAssignableTo(SingularType.fromValue(this.value));

    if (this.isUnion())
      return this.types.some(type => type.isAssignableTo(other));

    if (this.isNullish())
      return other.isNullish();

    if (this.isInterface()) {
      if (other.isUnion())
        return other.isAssignableTo(this);

      if (!other.isInterface()) return false;
      const otherProperties = new Map(Array.from(this.properties.entries())
        .map<[string, InterfacePropertySignature<Type>]>(([key, signature]) => [key.value, signature]));

      const propertiesAreAssignable = Array.from(this.properties.entries())
        .map<[string, InterfacePropertySignature<Type>]>(([key, signature]) => [key.value, signature])
        .every(([key, { valueType }]) => (otherProperties.has(key) && otherProperties.get(key)!.valueType.isAssignableTo(valueType))
          || Array.from(other.indexSignatures.values()).some(type => type.isAssignableTo(valueType)));

      const indexSignaturesAreAssignable = Array.from(this.indexSignatures.entries())
        .every(([keyType, valueType]) => other.indexSignatures.has(keyType) && valueType.isAssignableTo(other.indexSignatures.get(keyType)!));

      return propertiesAreAssignable && indexSignaturesAreAssignable;
    }

    if (this.isArray()) {
      if (other.isUnion())
        return other.isAssignableTo(this);

      if (!other.isArray()) return false;
      return this.elementType.isAssignableTo(other.elementType);
    }

    if (this.isSingular())
      if (this.name === "Array") {
        if (other.isSingular() ? other.name !== "Array" : !other.isArray()) return false;
        if (other.isSingular() ? (other.typeArguments !== undefined && other.typeArguments.length < 1) : false) return false;

        const elementType = this.isArray() ? this.elementType : this.typeArguments![0];
        return other.isArray() ?
          other.elementType.is(elementType)
          : elementType.is((<SingularType>other).typeArguments![0]);
      } else if (other.isSingular()) {
        if (this.name === "any")
          return true;

        if (other.isLiteral())
          return other.isAssignableTo(this);

        if (this.typeArguments) {
          if (!other.typeArguments) return false;
          return this.typeArguments.every((arg, i) => arg.isAssignableTo(other.typeArguments![i]));
        }

        return this.name === other.name;
      } else
        return other.isAssignableTo(this);

    if (this.isFunction()) {
      if (!other.isFunction()) return false;

      const parametersAreAssignable = Array.from(this.parameterTypes.entries())
        .every(([key, paramType]) => other.parameterTypes.has(key) && paramType.isAssignableTo(other.parameterTypes.get(key)!));

      return parametersAreAssignable && this.returnType.isAssignableTo(other.returnType);
    }

    return false;
  }

  public toString(): string {
    return util.inspect(this)
  }
}