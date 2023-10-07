import { TypeError } from "../../../../errors";
import type { Token } from "../../../tokenization/token";
import type { Type } from "../../types/type";
import Syntax from "../../../tokenization/syntax-type";
import UnionType from "../../types/union-type";
import SingularType from "../../types/singular-type";
import ArrayType from "../../types/array-type";

export enum BoundBinaryOperatorType {
  Addition, Subtraction,
  Multiplication, Division, IntDivision,
  Exponentation, Modulus,
  EqualTo, NotEqualTo,
  LogicalAnd, LogicalOr,
  LessThan, GreaterThan,
  LessThanOrEqual, GreaterThanOrEqual,
  And, Or,
  BitwiseAnd, BitwiseOr, BitwiseXor,
  ShiftLeft, ShiftRight,
  NullishCoalescing,
  Concatenation,
  Repetition,
  Split
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

  public static get(operatorToken: Token<undefined>, leftType: Type, rightType: Type): BoundBinaryOperator {
    const operator = BOUND_BINARY_OPERATORS
      .find(op => op.syntaxes.includes(operatorToken.syntax)
        && leftType.isAssignableTo(op.leftType)
        && rightType.isAssignableTo(op.rightType));

    if (!operator)
      throw new TypeError(`Invalid operand types for '${operatorToken.lexeme}': ${leftType.toString()} ${operatorToken.lexeme} ${rightType.toString()}`, operatorToken);

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
    intOrFloat
  ),
  new BoundBinaryOperator(
    [Syntax.Plus, Syntax.PlusEqual],
    BoundBinaryOperatorType.Concatenation,
    new SingularType("string")
  ),
  new BoundBinaryOperator(
    [Syntax.Minus, Syntax.MinusEqual],
    BoundBinaryOperatorType.Subtraction,
    intOrFloat
  ),
  new BoundBinaryOperator(
    [Syntax.Star, Syntax.StarEqual],
    BoundBinaryOperatorType.Multiplication,
    intOrFloat
  ),
  new BoundBinaryOperator(
    [Syntax.Star, Syntax.StarEqual],
    BoundBinaryOperatorType.Repetition,
    new SingularType("string"),
    new SingularType("int"),
    new SingularType("string")
  ),
  new BoundBinaryOperator(
    [Syntax.Slash, Syntax.SlashEqual],
    BoundBinaryOperatorType.Division,
    intOrFloat
  ),
  new BoundBinaryOperator(
    [Syntax.Slash, Syntax.SlashEqual],
    BoundBinaryOperatorType.Split,
    new SingularType("string"),
    new SingularType("string"),
    new ArrayType(new SingularType("string"))
  ),
  new BoundBinaryOperator(
    [Syntax.SlashSlash, Syntax.SlashSlashEqual],
    BoundBinaryOperatorType.IntDivision,
    intOrFloat,
    intOrFloat,
    new SingularType("int")
  ),
  new BoundBinaryOperator(
    [Syntax.Carat, Syntax.CaratEqual, Syntax.StarStar, Syntax.StarStarEqual],
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
    new SingularType("any")
  ),
];