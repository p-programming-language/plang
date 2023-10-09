import toCamelCase from "to-camel-case";

import type { ValueType } from "../../../../code-analysis/type-checker";
import SingularType from "../../../../code-analysis/type-checker/types/singular-type";
import Intrinsic from "../../../values/intrinsic";

export default class Eval extends Intrinsic.Function {
  public readonly name = toCamelCase(this.constructor.name);
  public readonly returnType = new SingularType("any");
  public readonly argumentTypes = { source: new SingularType("string") };

  public call(source: string): ValueType {
    const enclosingResultOutputEnabled = this.interpreter!.runner.executionOptions.outputResult;
    this.interpreter!.runner.executionOptions.outputResult = false;
    const result = this.interpreter!.runner.doString(source);
    this.interpreter!.runner.executionOptions.outputResult = enclosingResultOutputEnabled;
    return result;
  }
}