import { BoundStatement } from "../bound-node";
import type { Token } from "../../tokenization/token";
import type { ModifierType } from "../../type-checker";
import type BoundVariableDeclarationStatement from "./variable-declaration";
import type BoundBlockStatement from "./block";
import type FunctionType from "../../type-checker/types/function-type";
import type Syntax from "../../tokenization/syntax-type";
import type AST from "../../parser/ast";

export default class BoundMethodDeclarationStatement extends BoundStatement {
  public constructor(
    public readonly modifiers: ModifierType[],
    public readonly name: Token<undefined, Syntax.Identifier>,
    public readonly type: FunctionType,
    public readonly parameters: BoundVariableDeclarationStatement[],
    public readonly body: BoundBlockStatement
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundStatement<R>): R {
    return visitor.visitMethodDeclarationStatement(this);
  }

  public get token(): Token {
    return this.name;
  }
}