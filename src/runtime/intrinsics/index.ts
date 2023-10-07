import { argv } from "process";
import path from "path";

import type { ValueType } from "../../code-analysis/type-checker";
import type { Type } from "../../code-analysis/type-checker/types/type";
import { fakeToken } from "../../utility";
import Syntax from "../../code-analysis/tokenization/syntax-type";
import SingularType from "../../code-analysis/type-checker/types/singular-type";
import ArrayType from "../../code-analysis/type-checker/types/array-type";
import FunctionType from "../../code-analysis/type-checker/types/function-type";
import Intrinsic from "../values/intrinsic";
import type Interpreter from "../interpreter";
import type P from "../../p";

import Std from "./libs/std";
import Eval from "./eval";

export default class Intrinsics {
  public constructor(
    public readonly interpreter: Interpreter
  ) {}

  public inject(): void {
    this.define("version$", this.interpreter.host.version, new SingularType("string"));
    this.define("filename$", this.interpreter.fileName, new SingularType("string"));
    this.define("dirname$", path.dirname(this.interpreter.fileName), new SingularType("string"));
    this.define("argv", argv.slice(3), new ArrayType(new SingularType("string")));
    this.defineFunction("eval", Eval);
    (new Std(this)).inject();
  }

  public define<V extends ValueType = ValueType>(name: string, value: V, type: Type): void {
    const identifier = fakeToken<undefined>(Syntax.Identifier, name);
    this.interpreter.resolver.define(identifier);
    this.interpreter.binder.defineSymbol(identifier, type);
    this.interpreter.globals.define(identifier, value, {
      mutable: false
    });
  }

  public defineFunction<F extends Intrinsic.Function>(name: string, IntrinsicFunction: { new(interpreter?: Interpreter): F }): void {
    const fn = new IntrinsicFunction(this.interpreter);
    const type = new FunctionType(new Map<string, Type>(Object.entries(fn.argumentTypes)), fn.returnType);
    this.define(name, fn, type);
  }
}