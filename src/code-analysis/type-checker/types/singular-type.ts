import { TYPE_KEYWORDS } from "../../syntax/keywords";
import Type from "./type";

export default class SingularType implements Type {
  public constructor(
    public readonly name: keyof typeof TYPE_KEYWORDS
  ) {}
}