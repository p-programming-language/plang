import { BoundStatement } from "../bound-node";
import type { Token } from "../../tokenization/token";
import type BoundClassBodyStatement from "./class-body";
import type VariableSymbol from "../variable-symbol";
import type InterfaceType from "../../type-checker/types/interface-type";
import type Syntax from "../../tokenization/syntax-type";
import type AST from "../../parser/ast";

export default class BoundClassStatement extends BoundStatement {
  public constructor(
    public readonly keyword: Token<undefined, Syntax.Class>,
    public readonly symbol: VariableSymbol<InterfaceType>,
    public readonly body: BoundClassBodyStatement,
    public readonly superclass?: Token<undefined, Syntax.Identifier>,
    public readonly mixins?: Token<undefined, Syntax.Identifier>[]
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundStatement<R>): R {
    return visitor.visitClassStatement(this);
  }

  public get token(): Token<undefined> {
    return this.symbol.name;
  }
}