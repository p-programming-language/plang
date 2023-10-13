import path from "path";

import type { ValueType } from "../../code-analysis/type-checker";
import type { Type } from "../../code-analysis/type-checker/types/type";
import { fakeToken } from "../../utility";
import type Interpreter from "../interpreter";
import Syntax from "../../code-analysis/tokenization/syntax-type";
import SingularType from "../../code-analysis/type-checker/types/singular-type";
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
    this.define(name, fn, fn.typeSignature);
  }

  public defineLib(name: string, IntrinsicLib: Intrinsic.LibCtor): void {
    const lib = new IntrinsicLib(this);
    console.log(IntrinsicLib, lib.name, lib.members.time)
    this.defineLibFromInstance(name, lib);
  }

  public defineLibFromInstance(name: string, lib: Intrinsic.Lib): void {
    const mappedLib = Object.entries(lib.members)
      .map(([ memberName, memberValue ]) => {
        let value;
        if (memberValue instanceof Function && "intrinsicKind" in <object>memberValue && (<any>memberValue).intrinsicKind === Intrinsic.Kind.Function)
          value = new (<Intrinsic.FunctionCtor>memberValue)(this.interpreter);
        else if ((memberValue instanceof Function && "intrinsicKind" in <object>memberValue) && ((<any>memberValue).intrinsicKind === Intrinsic.Kind.Lib || (<any>memberValue).intrinsicKind === Intrinsic.Kind.Class))
          value = new (<Intrinsic.LibCtor | Intrinsic.ClassCtor>memberValue)(this, lib.name);
        else
          value = memberValue;

        return [memberName, value];
      });

    this.define(name, Object.fromEntries(mappedLib), lib.typeSignature);
  }

  public defineClass(name: string, IntrinsicClass: Intrinsic.ClassCtor): void {
    const _class = new IntrinsicClass(this);
    this.defineClassFromInstance(name, _class);
  }

  public defineClassFromInstance(name: string, _class: Intrinsic.Class): void {
    this.define(name, _class, _class.typeSignature);
  }
}