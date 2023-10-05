import { Range } from "../../utility";
import { Callable, CallableType } from "./callable";
import type { ValueType } from "../../code-analysis/type-checker";
import type { VariableDeclarationStatement } from "../../code-analysis/parser/ast/statements/variable-declaration";
import type { FunctionDeclarationStatement } from "../../code-analysis/parser/ast/statements/function-declaration";
import type Interpreter from "../interpreter";
import HookedExceptions from "../hooked-exceptions";
import Scope from "../scope";

const MAX_FN_PARAMS = 255;

export default class PFunction<A extends ValueType[] = ValueType[], R extends ValueType = ValueType> extends Callable<A, R> {
  public override readonly type = CallableType.Function;
  private nonNullableParameters: VariableDeclarationStatement[] = [];

  public constructor(
    private readonly interpreter: Interpreter,
    private readonly closure: Scope,
    private readonly definition: FunctionDeclarationStatement
  ) {

    // assign default values & initialize param variables
    super();
    this.nonNullableParameters = this.parameters.filter(param => param.initializer !== undefined);
  }

  public call(...args: A): R | undefined {
    this.interpreter.scope = new Scope(this.closure);
    for (const param of this.parameters) {
      const defaultValue = param.initializer ? this.interpreter.evaluate(param.initializer) : undefined;
      const value = args[this.parameters.indexOf(param)] ?? defaultValue;
      this.interpreter.scope.define(param.identifier.name, value, {
        mutable: param.mutable
      });
    }

    try {
      this.interpreter.execute(this.definition.body);
    } catch(e) {
      if (e instanceof HookedExceptions.Return)
        return <R>e.value;

      throw e;
    }

    this.interpreter.scope = this.interpreter.scope.unwrap()!;
  }

  public get arity(): number | Range {
    const start = this.nonNullableParameters.length;
    const finish = this.parameters.length;
    return start === finish ? start : new Range(start, finish);
  }

  public toString(): string {
    return `<Function: ${this.address}>`
  }

  private get parameters(): VariableDeclarationStatement[] {
    return this.definition.parameters; // temporary lol
  }
}