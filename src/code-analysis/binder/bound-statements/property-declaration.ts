import { BoundExpression, BoundStatement } from "../bound-node";
import type { Token } from "../../tokenization/token";
import type { Type } from "../../type-checker/types/type";
import type { ModifierType } from "../../type-checker";
import type Syntax from "../../tokenization/syntax-type";
import type AST from "../../parser/ast";

export default class BoundPropertyDeclarationStatement extends BoundStatement {
  public constructor(
    public readonly modifiers: ModifierType[],
    public readonly name: Token<undefined, Syntax.Identifier>,
    public readonly type: Type,
    public readonly mutable: boolean,
    public readonly initializer?: BoundExpression,
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundStatement<R>): R {
    return visitor.visitPropertyDeclarationStatement(this);
  }

  public get token(): Token {
    return this.name;
  }
}