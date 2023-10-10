import path from "path";

import type { ValueType } from "../../code-analysis/type-checker";
import type { Type } from "../../code-analysis/type-checker/types/type";
import { fakeToken } from "../../utility";
import type Interpreter from "../interpreter";
import Syntax from "../../code-analysis/tokenization/syntax-type";
import SingularType from "../../code-analysis/type-checker/types/singular-type";
import FunctionType from "../../code-analysis/type-checker/types/function-type";
import Intrinsic from "../values/intrinsic";

export default class Intrinsics {
  public constructor(
    public readonly interpreter: Interpreter
  ) {}

  public inject(): void {
    this.define("filename$", this.interpreter.fileName, new SingularType("string"));
    this.define("dirname$", path.dirname(this.interpreter.fileName), new SingularType("string"));
  }

  public define<V extends ValueType = ValueType>(name: string, value: V, type: Type): void {
    const identifier = fakeToken(Syntax.Identifier, name, undefined);
    this.interpreter.resolver.define(identifier);
    this.interpreter.binder.defineSymbol(identifier, type);
    this.interpreter.globals.define(identifier, value, {
      mutable: false
    });
  }

  public defineFunction(name: string, IntrinsicFunction: Intrinsic.FunctionCtor): void {
    const fn = new IntrinsicFunction(this.interpreter);
    this.defineFunctionFromInstance(name, fn);
  }

  public defineFunctionFromInstance(name: string, fn: Intrinsic.Function): void {
    const type = new FunctionType(new Map<string, Type>(Object.entries(fn.argumentTypes)), fn.returnType);
    this.define(name, fn, type);
  }
}