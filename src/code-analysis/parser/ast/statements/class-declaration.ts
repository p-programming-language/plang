import type { Token } from "../../../tokenization/token";
import type { ClassBodyStatement } from "./class-body";
import type { ClassTypeExpression } from "../type-nodes/class-type";
import type { IdentifierExpression } from "../expressions/identifier";
import type Syntax from "../../../tokenization/syntax-type";
import AST from "..";

export class ClassDeclarationStatement extends AST.Statement {
  public constructor(
    public readonly keyword: Token<undefined, Syntax.Class>,
    public readonly name: Token<undefined, Syntax.Identifier>,
    public readonly body: ClassBodyStatement,
    public readonly typeRef: ClassTypeExpression,
    public readonly mixins: IdentifierExpression[],
    public readonly superclass?: IdentifierExpression,
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Statement<R>): R {
    return visitor.visitClassDeclarationStatement(this);
  }

  public get token(): Token<undefined, Syntax.Class> {
    return this.keyword
  }
}