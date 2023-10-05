import { argv } from "process";

import type { ValueType } from "../../code-analysis/type-checker";
import type { Type } from "../../code-analysis/type-checker/types/type";
import { fakeToken } from "../../utility";
import Syntax from "../../code-analysis/syntax/syntax-type";
import SingularType from "../../code-analysis/type-checker/types/singular-type";
import ArrayType from "../../code-analysis/type-checker/types/array-type";
import FunctionType from "../../code-analysis/type-checker/types/function-type";
import Intrinsic from "../types/intrinsic";
import type Interpreter from "../interpreter";

import Readln from "./readln";
import Eval from "./eval";

export default class Intrinsics {
  public constructor(
    private readonly interpreter: Interpreter
  ) {}

  public inject(): void {
    this.define("__version", this.interpreter.runner.version, new SingularType("string"));
    this.define("argv", argv.slice(2), new ArrayType(new SingularType("string")));
    this.defineFunction("readln", Readln);
    this.defineFunction("eval", Eval);
  }

  private defineFunction<F extends Intrinsic.Function>(name: string, IntrinsicFunction: { new(interpreter: Interpreter): F }): void {
    const fn = new IntrinsicFunction(this.interpreter);
    const type = new FunctionType(new Map<string, Type>(Object.entries(fn.argumentTypes)), fn.returnType);
    this.define(name, fn, type);
  }

  private define<V extends ValueType = ValueType>(name: string, value: V, type: Type): void {
    const identifier = fakeToken<undefined>(Syntax.Identifier, name);
    this.interpreter.resolver.define(identifier);
    this.interpreter.binder.defineSymbol(identifier, type);
    this.interpreter.globals.define(identifier, value, {
      mutable: false
    });
  }
}