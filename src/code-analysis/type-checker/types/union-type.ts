import SingularType from "./singular-type";
import Type from "./type";

export default class UnionType implements Type {
  public constructor(
    public readonly types: SingularType[]
  ) {}
}