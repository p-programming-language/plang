import type { Token } from "../../../tokenization/token";
import type { ClassBodyStatement } from "./class-body";
import type Syntax from "../../../tokenization/syntax-type";
import AST from "..";

export class ClassStatement extends AST.Statement {
  public constructor(
    public readonly token: Token<undefined, Syntax.Class>,
    public readonly name: Token<undefined, Syntax.Identifier>,
    public readonly body: ClassBodyStatement,
    public readonly superclass?: Token<undefined, Syntax.Identifier>,
    public readonly mixins?: Token<undefined, Syntax.Identifier>[]
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Statement<R>): R {
    return visitor.visitClassStatement(this);
  }
}