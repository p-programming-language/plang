import util from "util";

import { Range } from "./range";
import { MethodDeclarationStatement } from "../../code-analysis/parser/ast/statements/method-declaration";
import { Constructable, ConstructableType } from "./constructable";
import { generateAddress, getTypeFromTypeRef } from "../../utility";
import type { ValueType } from "../../code-analysis/type-checker";
import type { Callable } from "./callable";
import type { VariableDeclarationStatement } from "../../code-analysis/parser/ast/statements/variable-declaration";
import type { ClassDeclarationStatement } from "../../code-analysis/parser/ast/statements/class-declaration";
import type Interpreter from "../interpreter";
import type TypeTracker from "../../code-analysis/parser/type-tracker";
import PClassInstance from "./class-instance";
import Scope from "../scope";

export default class PClass<A extends ValueType[] = ValueType[]> extends Constructable<[Interpreter, ...A], PClassInstance> {
  public override readonly type = ConstructableType.Class;
  public readonly name = this.definition.name.lexeme;
  public readonly address = generateAddress();
  private nullableCtorParameters = this.ctorParameters.filter(param => param.initializer !== undefined || getTypeFromTypeRef(this.typeTracker, param.typeRef).isNullable());

  public constructor(
    public readonly definition: ClassDeclarationStatement,
    private readonly closure: Scope,
    private readonly typeTracker: TypeTracker
  ) { super(); }

  public construct(interpreter: Interpreter, ...args: A): PClassInstance {
    const scope = new Scope(this.closure);
    if (this.classConstructor) {
      const constructorFn = <Callable<[Interpreter, ...A]>>interpreter.evaluate(this.classConstructor);
      constructorFn.call(interpreter, ...args);
    }

    // TODO: extend with superclass and mixins
    // TODO: add class members to class instance
    return new PClassInstance(this, scope, interpreter, args);
  }

  public get constructorArity(): number | Range {
    const start = this.ctorParameters.length - this.nullableCtorParameters.length;
    const finish = this.ctorParameters.length;
    return start === finish ? start : new Range(start, finish);
  }

  private get classConstructor(): MethodDeclarationStatement | undefined {
    return this.definition.body.members
      .find((member): member is MethodDeclarationStatement => member instanceof MethodDeclarationStatement && member.name.lexeme === "construct");
  }

  private get ctorParameters(): VariableDeclarationStatement[] {
    return this.classConstructor?.parameters ?? [];
  }

  public [util.inspect.custom](): string {
    return this.toString();
  }

  public toString(): string {
    return `<Class: ${this.address}>`
  }
}