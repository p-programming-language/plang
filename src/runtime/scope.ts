import { Token } from "../code-analysis/syntax/token";
import { ValueType } from "../code-analysis/type-checker";

export default class Scope {
  public readonly values = new Map<string, ValueType>();

  public constructor(
    public readonly enclosing?: Scope
  ) {}

  public assign<V extends ValueType = ValueType>(name: Token, value: V): void {
    if (this.values.has(name.lexeme))
      return this.define(name.lexeme, value);

    if (this.enclosing !== undefined)
      return this.enclosing.assign(name, value);
  }

  public assignAt<V extends ValueType = ValueType>(distance: number, name: Token, value: V): void {
    this.ancestor(distance)?.values.set(name.lexeme, value);
  }

  public get<V extends ValueType = ValueType>(name: Token): V | undefined {
    if (this.values.has(name.lexeme))
      return <V>this.values.get(name.lexeme);

    if (this.enclosing !== undefined)
      return this.enclosing.get(name);
  }

  public getAt<V extends ValueType = ValueType>(distance: number, name: string): V | undefined {
    return <V>this.ancestor(distance)?.values.get(name);
  }

  public define<V extends ValueType = ValueType>(name: string, value: V): void {
    this.values.set(name, value);
  }

  public ancestor(distance: number): Scope | undefined {
    let env: Scope = this;
    for (let i = 0; i < distance; i++)
      env = <Scope>env.enclosing;

    return env;
  }
}