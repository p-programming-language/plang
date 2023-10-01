enum Syntax {
  Int,
  Float,
  String,
  Boolean,

  Identifier,
  Function,

  AnyType,
  IntType,
  FloatType,
  StringType,
  BoolType,
  VoidType,
  Null, Undefined,

  LParen, RParen,
  LBracket, RBracket,
  LBrace, RBrace,
  Dot, Colon,
  LT, GT, LTE, GTE,// <, >, <=, >=
  Plus, Minus,
  Star, Slash, SlashSlash,
  Carat, Percent,
  PlusEqual, MinusEqual,
  StarEqual, SlashEqual, SlashSlashEqual,
  CaratEqual, PercentEqual,
  PlusPlus, MinusMinus,
  Bang,
  Hashtag,
  Equal, EqualEqual, BangEqual,

  EOF
}

export default Syntax;