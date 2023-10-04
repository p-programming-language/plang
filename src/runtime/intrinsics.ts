import { ValueType } from "../code-analysis/type-checker";
import { Type } from "../code-analysis/type-checker/types/type";
import { fakeToken } from "../lib/utility";
import Syntax from "../code-analysis/syntax/syntax-type";
import SingularType from "../code-analysis/type-checker/types/singular-type";
import Interpreter from "./interpreter";
import Resolver from "../code-analysis/resolver";
import Binder from "../code-analysis/type-checker/binder";
import pkg = require("../../package.json");

export default class Intrinsics {
  public constructor(
    private readonly interpreter: Interpreter,
    private readonly resolver: Resolver,
    private readonly binder: Binder
  ) {}

  public inject(): void {
    this.defineIntrinsic("__version", "v" + pkg.version, new SingularType("string"));
  }

  private defineIntrinsic<V extends ValueType = ValueType>(name: string, value: V, type: Type): void {
    const identifier = fakeToken<undefined>(Syntax.Identifier, name);
    this.resolver.define(identifier);
    this.binder.defineSymbol(identifier, type);
    this.interpreter.globals.define(identifier, value, {
      mutable: false
    });
  }
}