import Syntax from "./syntax-type";

export const TYPE_SYNTAXES = [
  Syntax.INT,
  Syntax.FLOAT,
  Syntax.STRING,
  Syntax.BOOLEAN,
  Syntax.FUNCTION,
  Syntax.INT_TYPE,
  Syntax.FLOAT_TYPE,
  Syntax.STRING_TYPE,
  Syntax.BOOLEAN_TYPE,
  Syntax.VOID_TYPE,
  Syntax.NULL,
  Syntax.UNDEFINED
];

export const LITERAL_SYNTAXES = [
  Syntax.BOOLEAN,
  Syntax.STRING,
  Syntax.FLOAT,
  Syntax.INT,
  Syntax.NULL,
  Syntax.UNDEFINED
];

export const UNARY_SYNTAXES = [
  Syntax.PLUS_PLUS,
  Syntax.MINUS_MINUS,
  Syntax.PLUS,
  Syntax.MINUS,
  Syntax.BANG,
  Syntax.HASHTAG
];