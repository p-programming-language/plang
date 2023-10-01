import Type from "./types/type";

export default class VariableSymbol {
  public constructor(
    public readonly name: string,
    public readonly type: Type
  ) {}
}