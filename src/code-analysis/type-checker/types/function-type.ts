import { Type, TypeKind } from "./type";
import SingularType from "./singular-type";

export default class FunctionType extends SingularType {
  public override readonly kind = TypeKind.Function;

  public constructor(
    public readonly parameterTypes: Map<string, Type>,
    public readonly returnType: Type
    // public readonly typeParameters?: Type[]
  ) { super("Function"); }

  public toString(): string {
    const parameterList = Array.from(this.parameterTypes.entries())
      .map(([name, type]) => `${name}: ${type.toString()}`)
      .join(", ");

    return `(${parameterList}) => ${this.returnType.toString()}`;
  }
}