import { Range } from "./range";
import { MethodDeclarationStatement } from "../../code-analysis/parser/ast/statements/method-declaration";
import { generateAddress, getTypeFromTypeRef } from "../../utility";
import type { ValueType } from "../../code-analysis/type-checker";
import type { VariableDeclarationStatement } from "../../code-analysis/parser/ast/statements/variable-declaration";
import type PClass from "./class";
import type Interpreter from "../interpreter";
import type Scope from "../scope";
import PValue from "./value";

export default class PClassInstance extends PValue {
  public readonly name = this.parent.definition.name.lexeme;
  public readonly address = generateAddress();

  public constructor(
    public readonly parent: PClass,
    public readonly closure: Scope,
    public readonly interpreter: Interpreter,
    public readonly constructArguments: ValueType[]
  ) { super(); }

  public toString(): string {
    return this.name;
  }
}