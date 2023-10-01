import { BoundUnaryOperator, BoundUnaryOperatorType } from "./unary";
import Syntax from "../../../syntax/syntax-type";
import SingularType from "../../types/singular-type";
import UnionType from "../../types/union-type";

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
]

export default BOUND_UNARY_OPERATORS;