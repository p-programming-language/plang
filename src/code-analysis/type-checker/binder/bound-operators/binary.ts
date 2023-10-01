import { BindingError } from "../../../../errors";
import BOUND_BINARY_OPERATORS from "./all-binary-operators";
import Syntax from "../../../syntax/syntax-type";
import Type from "../../types/type";

export const enum BoundBinaryOperatorType {
  Addition,
  Subtraction,
  Multiplication,
  Division,
  IntDivision,
  Exponentation,
  Modulus,
  EqualTo,
  NotEqualTo,
  LogicalAnd,
  LogicalOr
}

export class BoundBinaryOperator {
  public rightType: Type;
  public resultType: Type;

  public constructor(
    syntax: Syntax,
    type: BoundBinaryOperatorType,
    leftType: Type,
    rightType: Type,
    resultType: Type
  );

  public constructor(
    syntax: Syntax,
    type: BoundBinaryOperatorType,
    operandType: Type,
    resultType: Type
  );

  public constructor(
    syntax: Syntax,
    type: BoundBinaryOperatorType,
    nodeType: Type
  );

  public constructor(
    public readonly syntax: Syntax,
    public readonly type: BoundBinaryOperatorType,
    public leftType: Type,
    rightType?: Type,
    resultType?: Type
  ) {

    if (rightType && !resultType) {
      this.resultType = rightType;
      this.rightType = leftType;
    } else if (!rightType && !resultType) {
      this.resultType = leftType;
      this.rightType = leftType;
    } else {
      this.resultType = <Type>resultType;
      this.rightType = <Type>rightType;
    }
  }

  public static bind(syntax: Syntax, leftType: Type, rightType: Type): BoundBinaryOperator {
    const operator = BOUND_BINARY_OPERATORS
      .find(op => op.syntax == syntax && op.leftType == leftType && op.rightType == rightType);

    if (!operator)
      throw new BindingError(`Invalid bound binary operator syntax: ${Syntax[syntax]}`);

    return operator;
  }
}