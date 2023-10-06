import { Token } from "../../../tokenization/token";
import { VariableDeclarationStatement } from "./variable-declaration";
import { BlockStatement } from "./block";
import AST from "..";

export class FunctionDeclarationStatement extends AST.Statement {
  public constructor(
    public readonly token: Token<undefined>,
    public readonly name: Token<undefined>,
    public readonly returnType: AST.TypeRef,
    public readonly parameters: VariableDeclarationStatement[],
    public readonly body: BlockStatement
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.Statement<R>): R {
    return visitor.visitFunctionDeclarationStatement(this);
  }
}