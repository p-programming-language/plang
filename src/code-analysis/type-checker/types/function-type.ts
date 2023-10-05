import { Type, TypeKind } from "./type";
import SingularType from "./singular-type";

export default class FunctionType extends SingularType {
  public override readonly kind = TypeKind.Function;

  public constructor(
    public readonly parameterTypes: Map<string, Type>,
    public readonly returnType: Type,
    // public readonly typeParameters?: TypeParameter[]
  ) { super("Function"); }

  public toString(): string {
    const parameterList = Array.from(this.parameterTypes.entries())
      .map(([name, type]) => `${type.toString()} ${name}`)
      .join(", ");

    return `(${parameterList}) => ${this.returnType.toString()}`;
  }
}