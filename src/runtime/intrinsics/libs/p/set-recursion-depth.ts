import toCamelCase from "to-camel-case";

import SingularType from "../../../../code-analysis/type-checker/types/singular-type";
import Intrinsic from "../../../values/intrinsic";

export default class SetRecursionDepth extends Intrinsic.Function {
  public readonly name = toCamelCase(this.constructor.name);
  public readonly returnType = new SingularType("void");
  public readonly argumentTypes = { depth: new SingularType("int") };

  public call(depth: number): void {
    this.interpreter!.maxRecursionDepth = depth;
  }
}