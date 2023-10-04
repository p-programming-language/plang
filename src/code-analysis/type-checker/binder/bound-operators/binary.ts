import { BindingError } from "../../../../errors";
import type { Token } from "../../../syntax/token";
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
  LogicalOr,
  LessThan,
  GreaterThan,
  LessThanOrEqual,
  GreaterThanOrEqual,
  And,
  Or,
  BitwiseAnd,
  BitwiseOr,
  BitwiseXor,
  ShiftLeft,
  ShiftRight,
  NullishCoalescing
}

export class BoundBinaryOperator {
  public rightType: Type;
  public resultType: Type;

  public constructor(
    syntaxes: Syntax[],
    type: BoundBinaryOperatorType,
    leftType: Type,
    rightType: Type,
    resultType: Type
  );

  public constructor(
    syntaxes: Syntax[],
    type: BoundBinaryOperatorType,
    operandType: Type,
    resultType: Type
  );

  public constructor(
    syntaxes: Syntax[],
    type: BoundBinaryOperatorType,
    nodeType: Type
  );

  public constructor(
    public readonly syntaxes: Syntax[],
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

  public static get(operatorToken: Token<undefined>): BoundBinaryOperator {
    const operator = BOUND_BINARY_OPERATORS
      .find(op => op.syntaxes.includes(operatorToken.syntax));

    if (!operator)
      throw new BindingError(`Invalid bound binary operator syntax: ${Syntax[operatorToken.syntax]}`, operatorToken);

    return operator;
  }
}

const intOrFloat = new UnionType([
  new SingularType("int"),
  new SingularType("float")
]);

const BOUND_BINARY_OPERATORS = [
  new BoundBinaryOperator(
    [Syntax.Plus, Syntax.PlusEqual],
    BoundBinaryOperatorType.Addition,
    new UnionType([
      new SingularType("int"),
      new SingularType("float"),
      new SingularType("string")
    ])
  ),
  new BoundBinaryOperator(
    [Syntax.Minus, Syntax.MinusEqual],
    BoundBinaryOperatorType.Subtraction,
    intOrFloat
  ),
  new BoundBinaryOperator(
    [Syntax.Star, Syntax.StarEqual],
    BoundBinaryOperatorType.Multiplication,
    new UnionType([
      new SingularType("int"),
      new SingularType("float"),
      new SingularType("string") // allow string * int/float for string repeating
    ]),
    intOrFloat
  ),
  new BoundBinaryOperator(
    [Syntax.Slash, Syntax.SlashEqual],
    BoundBinaryOperatorType.Division,
    intOrFloat
  ),
  new BoundBinaryOperator(
    [Syntax.SlashSlash, Syntax.SlashSlashEqual],
    BoundBinaryOperatorType.IntDivision,
    intOrFloat,
    intOrFloat,
    new SingularType("int")
  ),
  new BoundBinaryOperator(
    [Syntax.Carat, Syntax.CaratEqual],
    BoundBinaryOperatorType.Exponentation,
    intOrFloat
  ),
  new BoundBinaryOperator(
    [Syntax.Percent, Syntax.PercentEqual],
    BoundBinaryOperatorType.Modulus,
    intOrFloat
  ),
  new BoundBinaryOperator(
    [Syntax.EqualEqual],
    BoundBinaryOperatorType.EqualTo,
    new SingularType("any"),
    new SingularType("any"),
    new SingularType("bool")
  ),
  new BoundBinaryOperator(
    [Syntax.BangEqual],
    BoundBinaryOperatorType.NotEqualTo,
    new SingularType("any"),
    new SingularType("any"),
    new SingularType("bool")
  ),
  new BoundBinaryOperator(
    [Syntax.LT],
    BoundBinaryOperatorType.LessThan,
    intOrFloat,
    intOrFloat,
    new SingularType("bool")
  ),
  new BoundBinaryOperator(
    [Syntax.GT],
    BoundBinaryOperatorType.GreaterThan,
    intOrFloat,
    intOrFloat,
    new SingularType("bool")
  ),
  new BoundBinaryOperator(
    [Syntax.LTE],
    BoundBinaryOperatorType.LessThanOrEqual,
    intOrFloat,
    intOrFloat,
    new SingularType("bool")
  ),
  new BoundBinaryOperator(
    [Syntax.GTE],
    BoundBinaryOperatorType.GreaterThanOrEqual,
    intOrFloat,
    intOrFloat,
    new SingularType("bool")
  ),
  new BoundBinaryOperator(
    [Syntax.AmpersandAmpersand, Syntax.AmpersandAmpersandEqual],
    BoundBinaryOperatorType.And,
    new SingularType("any"),
    new SingularType("any"),
    new SingularType("bool")
  ),
  new BoundBinaryOperator(
    [Syntax.PipePipe, Syntax.PipePipeEqual],
    BoundBinaryOperatorType.Or,
    new SingularType("any"),
    new SingularType("any"),
    new SingularType("bool")
  ),
  new BoundBinaryOperator(
    [Syntax.Ampersand, Syntax.AmpersandEqual],
    BoundBinaryOperatorType.BitwiseAnd,
    new SingularType("int"),
  ),
  new BoundBinaryOperator(
    [Syntax.Pipe, Syntax.PipeEqual],
    BoundBinaryOperatorType.BitwiseOr,
    new SingularType("int")
  ),
  new BoundBinaryOperator(
    [Syntax.LDoubleArrow],
    BoundBinaryOperatorType.ShiftLeft,
    new SingularType("int")
  ),
  new BoundBinaryOperator(
    [Syntax.RDoubleArrow],
    BoundBinaryOperatorType.ShiftRight,
    new SingularType("int")
  ),
  new BoundBinaryOperator(
    [Syntax.Tilde],
    BoundBinaryOperatorType.BitwiseXor,
    new SingularType("int")
  ),
  new BoundBinaryOperator(
    [Syntax.QuestionQuestion, Syntax.QuestionQuestionEqual],
    BoundBinaryOperatorType.NullishCoalescing,
    new SingularType("any"),
    new SingularType("any"),
    new SingularType("any")
  ),
];