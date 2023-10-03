import type { Type } from "../types/type";
import AST from "../../parser/ast";

export abstract class BoundNode extends AST.Node {}

export abstract class BoundExpression extends BoundNode {
  public abstract type: Type;
  public abstract accept<R>(visitor: AST.Visitor.BoundExpression<R>): R
}
export abstract class BoundStatement extends BoundNode {
  public type?: Type = undefined;
  public abstract accept<R>(visitor: AST.Visitor.BoundStatement<R>): R
}
