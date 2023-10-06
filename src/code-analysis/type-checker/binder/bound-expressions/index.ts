import { BoundExpression } from "../bound-node";
import type { Token } from "../../../tokenization/token";
import type { Type } from "../../types/type";
import type { IndexType } from "../..";
import BoundLiteralExpression from "./literal";
import SingularType from "../../types/singular-type";
import AST from "../../../parser/ast";

export default class BoundIndexExpression extends BoundExpression {
  public override readonly type: Type;

  public constructor(
    public readonly token: Token<undefined>,
    public readonly object: BoundExpression,
    public readonly index: BoundExpression
  ) {

    super();
    this.type = new SingularType("undefined");

    if (object.type.isArray())
      this.type = object.type.elementType;
    else if (object.type.isSingular() && object.type.name === "Array")
      this.type = object.type.typeArguments![0];
    else if (object.type.isInterface() && index instanceof BoundLiteralExpression && index.type.isSingular() && (index.type.name === "string" || index.type.name === "int")) {
      const type = object.type.properties.get(index.token.value!.toString()) ?? object.type.indexSignatures.get(<IndexType>index.type);
      if (!type) return;
      this.type = type;
    }
  }

  public accept<R>(visitor: AST.Visitor.BoundExpression<R>): R {
    return visitor.visitIndexExpression(this);
  }
}