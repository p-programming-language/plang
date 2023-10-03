import { BindingError } from "../../../../errors";
import type { Token } from "../../../syntax/token";
import type { Type } from "../../types/type";
import Syntax from "../../../syntax/syntax-type";
import SingularType from "../../types/singular-type";
import UnionType from "../../types/union-type";


export const enum BoundUnaryOperatorType {
  Identity,
  Negate,
  Increment,
  Decrement,
  Length,
  Not,
  BitwiseNot
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

  public static get(operatorToken: Token<undefined>): BoundUnaryOperator {
    const operator = BOUND_UNARY_OPERATORS
      .find(op => op.syntax === operatorToken.syntax);

    if (!operator)
      throw new BindingError(`Invalid bound unary operator syntax: ${Syntax[operatorToken.syntax]}`, operatorToken);

    return operator;
  }
}

const BOUND_UNARY_OPERATORS = [
  new BoundUnaryOperator(
    Syntax.Plus,
    BoundUnaryOperatorType.Identity,
    new UnionType([
      new SingularType("int"),
      new SingularType("float")
    ])
  ),
  new BoundUnaryOperator(
    Syntax.Minus,
    BoundUnaryOperatorType.Negate,
    new UnionType([
      new SingularType("int"),
      new SingularType("float")
    ])
  ),
  new BoundUnaryOperator(
    Syntax.PlusPlus,
    BoundUnaryOperatorType.Increment,
    new UnionType([
      new SingularType("int"),
      new SingularType("float")
    ])
  ),
  new BoundUnaryOperator(
    Syntax.MinusMinus,
    BoundUnaryOperatorType.Decrement,
    new UnionType([
      new SingularType("int"),
      new SingularType("float")
    ])
  ),
  // new BoundUnaryOperator(
  //   Syntax.Hashtag,
  //   BoundUnaryOperatorType.Length,
  //   new SingularType("Array"),
  //   new SingularType("int")
  // ),
  new BoundUnaryOperator(
    Syntax.Bang,
    BoundUnaryOperatorType.Not,
    new SingularType("any"),
    new SingularType("bool")
  ),
  new BoundUnaryOperator(
    Syntax.Tilde,
    BoundUnaryOperatorType.BitwiseNot,
    new SingularType("int")
  )
];