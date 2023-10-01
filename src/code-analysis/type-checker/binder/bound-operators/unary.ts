import { BindingError } from "../../../../errors";
import BOUND_UNARY_OPERATORS from "./all-unary-operators";
import Syntax from "../../../syntax/syntax-type";
import Type from "../../types/type";

export const enum BoundUnaryOperatorType {
  Identity,
  Negate,
  Increment,
  Decrement,
  Length,
  Not
}

export class BoundUnaryOperator {
  public resultType: Type;

  public constructor(
    syntax: Syntax,
    type: BoundUnaryOperatorType,
    operandType: Type,
    resultType: Type
  );

  public constructor(
    syntax: Syntax,
    type: BoundUnaryOperatorType,
    nodeType: Type
  );

  public constructor(
    public readonly syntax: Syntax,
    public readonly type: BoundUnaryOperatorType,
    public operandType: Type,
    resultType?: Type
  ) {

    if (!resultType)
      this.resultType = operandType;
    else
      this.resultType = <Type>resultType;
  }

  public static bind(syntax: Syntax, operandType: Type): BoundUnaryOperator {
    const operator = BOUND_UNARY_OPERATORS
      .find(op => op.syntax == syntax && op.operandType == operandType);

    if (!operator)
      throw new BindingError(`Invalid bound unary operator syntax: ${Syntax[syntax]}`);

    return operator;
  }
}