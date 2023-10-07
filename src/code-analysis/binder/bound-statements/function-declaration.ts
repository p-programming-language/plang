import { BoundStatement } from "../bound-node";
import type { Token } from "../../tokenization/token";
import type VariableSymbol from "../variable-symbol";
import type BoundVariableDeclarationStatement from "./variable-declaration";
import type BoundBlockStatement from "./block";
import type FunctionType from "../../type-checker/types/function-type";
import AST from "../../parser/ast";

export default class BoundFunctionDeclarationStatement extends BoundStatement {
  public override readonly type = this.symbol.type;

  public constructor(
    public readonly symbol: VariableSymbol<FunctionType>,
    public readonly parameters: BoundVariableDeclarationStatement[],
    public readonly body: BoundBlockStatement
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundStatement<R>): R {
    return visitor.visitFunctionDeclarationStatement(this);
  }

  public get token(): Token {
    return this.symbol.name;
  }
}