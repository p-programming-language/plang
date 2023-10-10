import { Range } from "./range";
import { Callable, CallableType } from "./callable";
import { getTypeFromTypeRef } from "../../utility";
import type { ValueType } from "../../code-analysis/type-checker";
import type { VariableDeclarationStatement } from "../../code-analysis/parser/ast/statements/variable-declaration";
import type { FunctionDeclarationStatement } from "../../code-analysis/parser/ast/statements/function-declaration";
import type { MethodDeclarationStatement } from "../../code-analysis/parser/ast/statements/method-declaration";
import type Interpreter from "../interpreter";
import type TypeTracker from "../../code-analysis/parser/type-tracker";
import HookedExceptions from "../hooked-exceptions";
import Scope from "../scope";

const MAX_FN_PARAMS = 255;

export default class PFunction<A extends ValueType[] = ValueType[], R extends ValueType = ValueType> extends Callable<[Interpreter, ...A], R> {
  public readonly name = this.definition.name.lexeme;
  public override readonly type = CallableType.Function;
  private nullableParameters = this.parameters.filter(param => param.initializer !== undefined || getTypeFromTypeRef(this.typeTracker, param.typeRef).isNullable());

  public constructor(
    public readonly definition: FunctionDeclarationStatement | MethodDeclarationStatement,
    private readonly closure: Scope,
    private readonly typeTracker: TypeTracker
  ) { super(); }

  public call(interpreter: Interpreter, ...args: A): R | undefined {
    const scope = new Scope(this.closure);
    for (const param of this.parameters) {
      const defaultValue = param.initializer ? interpreter.evaluate(param.initializer) : undefined;
      const value = args[this.parameters.indexOf(param)] ?? defaultValue;
      scope.define(param.identifier.name, value, {
        mutable: param.mutable
      });
    }

    interpreter.startRecursion(this.definition.token);
    try {
      interpreter.executeBlock(this.definition.body, scope);
    } catch(e: any) {
      if (e instanceof HookedExceptions.Return)
        return <R>e.value;

      throw e;
    }

    interpreter.endRecursion();
  }

  public get arity(): number | Range {
    const start = this.parameters.length - this.nullableParameters.length;
    const finish = this.parameters.length;
    return start === finish ? start : new Range(start, finish);
  }

  public toString(): string {
    return `<Function: ${this.address}>`
  }

  private get parameters(): VariableDeclarationStatement[] {
    return this.definition.parameters;
  }
}