import { BoundBinaryOperator, BoundBinaryOperatorType } from "./binary";
import Syntax from "../../../syntax/syntax-type";
import SingularType from "../../types/singular-type";
import UnionType from "../../types/union-type";

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
]

export default BOUND_BINARY_OPERATORS;