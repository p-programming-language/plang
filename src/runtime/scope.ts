import { Token } from "../code-analysis/syntax/token";
import { ValueType } from "../code-analysis/type-checker";
import { RuntimeError } from "../errors";

interface VariableOptions {
  readonly mutable: boolean;
}

export default class Scope {
  public readonly variableValues = new Map<string, ValueType>();
  public readonly variableOptions = new Map<string, VariableOptions>();

  public constructor(
    public readonly enclosing?: Scope
  ) {}

  public checkImmutability(name: Token<undefined>): void {
    if (this.variableOptions.get(name.lexeme)!.mutable === false)
      throw new RuntimeError(`Attempt to assign to immutable variable '${name.lexeme}'`, name);
  }

  public assign<V extends ValueType = ValueType>(name: Token<undefined>, value: V): void {
    if (this.variableValues.has(name.lexeme)) {
      this.checkImmutability(name);
      this.variableValues.set(name.lexeme, value);
      return;
    }

    if (this.enclosing !== undefined)
      return this.enclosing.assign(name, value);
  }

  public assignAt<V extends ValueType = ValueType>(distance: number, name: Token<undefined>, value: V): void {
    const scope = this.ancestor(distance);
    scope?.checkImmutability(name);
    scope?.variableValues.set(name.lexeme, value);
  }

  public get<V extends ValueType = ValueType>(name: Token<undefined>): V | undefined {
    if (this.variableValues.has(name.lexeme))
      return <V>this.variableValues.get(name.lexeme);

    if (this.enclosing !== undefined)
      return this.enclosing.get(name);
  }

  public getAt<V extends ValueType = ValueType>(distance: number, name: string): V | undefined {
    return <V>this.ancestor(distance)?.variableValues.get(name);
  }

  public define<V extends ValueType = ValueType>(name: Token<undefined>, value: V, options: VariableOptions): void {
    this.variableValues.set(name.lexeme, value);
    this.variableOptions.set(name.lexeme, options);
  }

  public ancestor(distance: number): Scope | undefined {
    let env: Scope = this;
    for (let i = 0; i < distance; i++)
      env = <Scope>env.enclosing;

    return env;
  }
}