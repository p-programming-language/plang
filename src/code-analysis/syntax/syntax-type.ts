enum Syntax {
  Int,
  Float,
  String,
  Boolean,
  Null, Undefined,

  Identifier,
  If, Unless, Else,
  While, Until,
  Function,
  Mut,

  Semicolon, Comma,
  LParen, RParen,
  LBracket, RBracket,
  LBrace, RBrace,
  Dot, Colon,
  LT, GT, LTE, GTE,// <, >, <=, >=
  LDoubleArrow, RDoubleArrow,
  Tilde,
  Question, QuestionQuestion, QuestionQuestionEqual,
  Plus, Minus,
  Star, Slash, SlashSlash,
  Carat, StarStar, Percent,
  PlusEqual, MinusEqual,
  StarEqual, SlashEqual, SlashSlashEqual,
  CaratEqual, StarStarEqual, PercentEqual,
  PlusPlus, MinusMinus,
  Bang,
  AmpersandAmpersand, AmpersandAmpersandEqual,
  Ampersand, AmpersandEqual,
  PipePipe, PipePipeEqual,
  Pipe, PipeEqual,
  Hashtag,
  Equal, EqualEqual, BangEqual, ColonEqual,

  EOF
}

export default Syntax;