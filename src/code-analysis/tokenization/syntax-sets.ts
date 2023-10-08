import Syntax from "./syntax-type";

export const COMPOUND_ASSIGNMENT_SYNTAXES = [
  Syntax.PlusEqual, Syntax.MinusEqual,
  Syntax.StarEqual, Syntax.SlashEqual, Syntax.SlashSlashEqual,
  Syntax.CaratEqual, Syntax.StarStarEqual, Syntax.PercentEqual,
  Syntax.AmpersandEqual, Syntax.PipeEqual,
  Syntax.AmpersandAmpersandEqual, Syntax.PipePipeEqual,
  Syntax.QuestionQuestionEqual
]

export const LITERAL_SYNTAXES = [
  Syntax.Boolean,
  Syntax.String,
  Syntax.Float,
  Syntax.Int,
  Syntax.Null,
  Syntax.Undefined
];

export const UNARY_SYNTAXES = [
  Syntax.Plus, Syntax.Minus,
  Syntax.Bang,
  Syntax.Tilde,
  Syntax.PlusPlus, Syntax.MinusMinus,
  Syntax.Hashtag,
  Syntax.TypeOf
];