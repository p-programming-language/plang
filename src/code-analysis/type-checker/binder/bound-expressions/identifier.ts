import { BoundExpression } from "../bound-node";
import type { Type } from "../../types/type";

export default class BoundIdentifierExpression extends BoundExpression {
  public constructor(
    public readonly name: string,
    public readonly type: Type
  ) { super(); }
}