import { TYPE_KEYWORDS } from "./keywords";
import Syntax from "./syntax-type";

export const COMPOUND_ASSIGNMENT_SYNTAXES = [
  Syntax.PlusEqual, Syntax.MinusEqual,
  Syntax.StarEqual, Syntax.SlashEqual, Syntax.SlashSlashEqual,
  Syntax.CaratEqual, Syntax.PercentEqual,
  Syntax.AmpersandEqual, Syntax.PipeEqual,
  Syntax.AmpersandAmpersandEqual, Syntax.PipePipeEqual,
  Syntax.QuestionQuestionEqual
]

export const TYPE_SYNTAXES = Object.values(TYPE_KEYWORDS);

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