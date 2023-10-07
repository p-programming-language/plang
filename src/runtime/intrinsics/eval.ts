import type { ValueType } from "../../code-analysis/type-checker";
import SingularType from "../../code-analysis/type-checker/types/singular-type";
import Intrinsic from "../values/intrinsic";

export default class Eval extends Intrinsic.Function {
  public readonly argumentTypes = { code: new SingularType("string") };
  public readonly returnType = new SingularType("any");

  public call(code: string): ValueType {
    const enclosingResultOutputEnabled = this.interpreter!.runner.executionOptions.outputResult;
    this.interpreter!.runner.executionOptions.outputResult = false;
    const result = this.interpreter!.runner.doString(code);
    this.interpreter!.runner.executionOptions.outputResult = enclosingResultOutputEnabled;
    return result;
  }
}