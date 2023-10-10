import { BoundExpression } from "../bound-node";
import type { Token } from "../../tokenization/token";
import type { Type } from "../../type-checker/types/type";
import type { IndexType } from "../../type-checker";
import type AST from "../../parser/ast";
import BoundLiteralExpression from "./literal";
import SingularType from "../../type-checker/types/singular-type";
import IntrinsicExtension from "../../../runtime/intrinsics/value-extensions";

export default class BoundAccessExpression extends BoundExpression {
  public override readonly type: Type;

  public constructor(
    public readonly token: Token<undefined>,
    public readonly object: BoundExpression,
    public readonly index: BoundExpression,
    typeOverride?: Type
  ) {

    super();
    this.type = new SingularType("undefined");

    if (typeOverride)
      this.type = typeOverride;
    else if (object.type.isArray())
      this.type = object.type.elementType;
    else if (object.type.isInterface() && index instanceof BoundLiteralExpression) {
      const propertyType = new Map(Array.from(object.type.members.entries())
        .map(([key, value]) => [key.value, value]))
        .get(index.token.value!.toString())?.valueType

      const type = propertyType ?? object.type.indexSignatures.get(<IndexType>index.type);
      if (!type) return;
      this.type = type;
    } else if ((object.type.isSingular() && object.type.name === "any") || (object.type.isUnion() && object.type.types.map(t => t.name).includes("any") && !object.type.isNullable()))
      this.type = new SingularType("any");
    else if (object.type.isSingular() && object.type.name === "Array")
      this.type = object.type.typeArguments![0];
  }

  public accept<R>(visitor: AST.Visitor.BoundExpression<R>): R {
    return visitor.visitIndexExpression(this);
  }
}