import toCamelCase from "to-camel-case";

import type { ValueType } from "../../code-analysis/type-checker";
import SingularType from "../../code-analysis/type-checker/types/singular-type";
import Intrinsic from "../values/intrinsic";

export default class SetRecursionDepth extends Intrinsic.Function {
  public readonly name = toCamelCase(this.constructor.name);
  public readonly returnType = new SingularType("void");
  public readonly argumentTypes = { depth: new SingularType("int") };

  public call(depth: number): ValueType {
    this.interpreter!.maxRecursionDepth = depth;
  }
}