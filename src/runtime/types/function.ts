import { Range } from "../../utility";
import { Callable, CallableType } from "./callable";
import type { ValueType } from "../../code-analysis/type-checker";
import type { VariableDeclarationStatement } from "../../code-analysis/parser/ast/statements/variable-declaration";
import type Interpreter from "../interpreter";
import type AST from "../../code-analysis/parser/ast";
import HookedExceptions from "../hooked-exceptions";
import Scope from "../scope";

const MAX_FN_PARAMS = 255;

export default class PFunction<A extends ValueType[] = ValueType[], R extends ValueType = ValueType> extends Callable<A, R> {
  public override readonly type = CallableType.Function;
  private nonNullableParameters: VariableDeclarationStatement[] = [];

  public constructor(
    private readonly interpreter: Interpreter,
    private readonly closure: Scope,
    private readonly definition: AST.Statement // temporary lol (VariableDeclarationStatement)
  ) {

    // assign default values & initialize param variables
    super();
    // for (const param of this.parameters) {
    //   const value = param.defaultValue ? interpreter.evaluate(param.defaultValue) : undefined;
    //   closure.define(param.name, value, {
    //     mutable: param.mutable
    //   });
    // }

    // this.nonNullableParameters = this.parameters.filter(param => param.defaultValue !== undefined);
  }

  public call(...args: A): R | undefined {
    const callScope = new Scope(this.closure);
    // for (const param of this.parameters) {
    //   const defaultValue = param.defaultValue ? this.interpreter.evaluate(param.defaultValue) : undefined;
    //   const value = args.at(this.parameters.indexOf(param)) ?? defaultValue;
    //   callScope.define(param.name, value, {
    //     mutable: param.mutable
    //   });
    // }

    try {
      // this.interpreter.execute(this.definition.body);
    } catch(e) {
      if (e instanceof HookedExceptions.Return)
        return <R>e.value;

      throw e;
    }
  }

  public get arity(): number | Range {
    const start = this.nonNullableParameters.length;
    const finish = this.parameters.length;

    if (start === finish)
      return start;
    else
      return new Range(start, finish);
  }

  public toString(): string {
    return `<Function: ${this.address}>`
  }

  private get parameters(): VariableDeclarationStatement[] {
    return (<any>this.definition).parameters; // temporary lol
  }
}