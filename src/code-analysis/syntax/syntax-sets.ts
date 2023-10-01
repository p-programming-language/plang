import Syntax from "./syntax-type";

export const TYPE_SYNTAXES = [
  Syntax.Int,
  Syntax.Float,
  Syntax.String,
  Syntax.Boolean,
  Syntax.Function,
  Syntax.IntType,
  Syntax.FloatType,
  Syntax.StringType,
  Syntax.BoolType,
  Syntax.VoidType,
  Syntax.Null,
  Syntax.Undefined
];

export const LITERAL_SYNTAXES = [
  Syntax.Boolean,
  Syntax.String,
  Syntax.Float,
  Syntax.Int,
  Syntax.Null,
  Syntax.Undefined
];

export const UNARY_SYNTAXES = [
  Syntax.PlusPlus,
  Syntax.MinusMinus,
  Syntax.Plus,
  Syntax.Minus,
  Syntax.Bang,
  Syntax.Hashtag
];