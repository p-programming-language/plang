import { BoundStatement } from "../bound-node";
import type { Token } from "../../tokenization/token";
import type { Type } from "../../type-checker/types/type";
import type BoundClassBodyStatement from "./class-body";
import type VariableSymbol from "../variable-symbol";
import type ClassType from "../../type-checker/types/class-type";
import type Syntax from "../../tokenization/syntax-type";
import type AST from "../../parser/ast";

export default class BoundClassDeclarationStatement extends BoundStatement {
  public override readonly type = this.symbol.type;

  public constructor(
    public readonly keyword: Token<undefined, Syntax.Class>,
    public readonly symbol: VariableSymbol<ClassType>,
    public readonly body: BoundClassBodyStatement,
    public readonly mixins: Type[],
    public readonly superclass?: Type,
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundStatement<R>): R {
    return visitor.visitClassStatement(this);
  }

  public get token(): Token<undefined> {
    return this.symbol.name;
  }
}