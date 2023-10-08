import { UnaryExpression } from "./unary";
import type AST from "..";

export class TypeOfExpression extends UnaryExpression {
  public accept<R>(visitor: AST.Visitor.Expression<R>): R {
    return visitor.visitTypeOfExpression(this);
  }
}