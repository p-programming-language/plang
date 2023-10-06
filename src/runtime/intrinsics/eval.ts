import { ValueType } from "../../code-analysis/type-checker";
import Intrinsic from "../types/intrinsic";
import SingularType from "../../code-analysis/type-checker/types/singular-type";

export default class Eval extends Intrinsic.Function {
  public readonly argumentTypes = { code: new SingularType("string") };
  public readonly returnType = new SingularType("any");

  public call(code: string): ValueType {
    const enclosingResultOutputEnabled = this.intrinsics.interpreter.runner.executionOptions.outputResult;
    this.intrinsics.interpreter.runner.executionOptions.outputResult = false;
    const result = this.intrinsics.interpreter.runner.doString(code);
    this.intrinsics.interpreter.runner.executionOptions.outputResult = enclosingResultOutputEnabled;
    return result;
  }
}