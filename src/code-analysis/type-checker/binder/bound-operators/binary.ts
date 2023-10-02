import { BindingError } from "../../../../errors";
import type { Type } from "../../types/type";
import Syntax from "../../../syntax/syntax-type";
import UnionType from "../../types/union-type";
import SingularType from "../../types/singular-type";

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

  public static get(syntax: Syntax): BoundBinaryOperator {
    const operator = BOUND_BINARY_OPERATORS
      .find(op => op.syntax === syntax);

    if (!operator)
      throw new BindingError(`Invalid bound binary operator syntax: ${Syntax[syntax]}`);

    return operator;
  }
}

const BOUND_BINARY_OPERATORS = [
  new BoundBinaryOperator(
    Syntax.Plus,
    BoundBinaryOperatorType.Addition,
    new UnionType([
      new SingularType("int"),
      new SingularType("float"),
      new SingularType("string")
    ])
  ),
  new BoundBinaryOperator(
    Syntax.Minus,
    BoundBinaryOperatorType.Subtraction,
    new UnionType([
      new SingularType("int"),
      new SingularType("float")
    ])
  ),
  new BoundBinaryOperator(
    Syntax.Star,
    BoundBinaryOperatorType.Multiplication,
    new UnionType([
      new SingularType("int"),
      new SingularType("float"),
      new SingularType("string") // allow string * int/float for string repeating
    ]),
    new UnionType([
      new SingularType("int"),
      new SingularType("float")
    ])
  ),
  new BoundBinaryOperator(
    Syntax.Slash,
    BoundBinaryOperatorType.Division,
    new UnionType([
      new SingularType("int"),
      new SingularType("float")
    ])
  ),
  new BoundBinaryOperator(
    Syntax.SlashSlash,
    BoundBinaryOperatorType.IntDivision,
    new UnionType([
      new SingularType("int"),
      new SingularType("float")
    ]),
    new UnionType([
      new SingularType("int"),
      new SingularType("float")
    ]),
    new SingularType("int")
  ),
  new BoundBinaryOperator(
    Syntax.Carat,
    BoundBinaryOperatorType.Exponentation,
    new UnionType([
      new SingularType("int"),
      new SingularType("float")
    ])
  ),
  new BoundBinaryOperator(
    Syntax.Percent,
    BoundBinaryOperatorType.Modulus,
    new UnionType([
      new SingularType("int"),
      new SingularType("float")
    ])
  ),
  new BoundBinaryOperator(
    Syntax.EqualEqual,
    BoundBinaryOperatorType.EqualTo,
    new SingularType("any"),
    new SingularType("any"),
    new SingularType("bool")
  ),
  new BoundBinaryOperator(
    Syntax.BangEqual,
    BoundBinaryOperatorType.NotEqualTo,
    new SingularType("any"),
    new SingularType("any"),
    new SingularType("bool")
  )
  // TODO: add logical and/or
];