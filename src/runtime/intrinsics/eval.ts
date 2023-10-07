import type { ValueType } from "../../code-analysis/type-checker";
import SingularType from "../../code-analysis/type-checker/types/singular-type";
import Intrinsic from "../values/intrinsic";

export default class Eval extends Intrinsic.Function {
  public readonly name = "eval";
  public readonly returnType = new SingularType("any");
  public readonly argumentTypes = { code: new SingularType("string") };

  public call(code: string): ValueType {
    const enclosingResultOutputEnabled = this.interpreter!.host.executionOptions.outputResult;
    this.interpreter!.host.executionOptions.outputResult = false;
    const result = this.interpreter!.host.doString(code);
    this.interpreter!.host.executionOptions.outputResult = enclosingResultOutputEnabled;
    return result;
  }
}