import Syntax from "./syntax-type";

export const KEYWORDS = {
  interface: Syntax.Interface,
  return: Syntax.Return,
  break: Syntax.Break,
  next: Syntax.Next,
  and: Syntax.AmpersandAmpersand,
  or: Syntax.PipePipe,
  not: Syntax.Bang,
  fn: Syntax.Function,
  if: Syntax.If,
  while: Syntax.While,
  unless: Syntax.Unless,
  until: Syntax.Until,
  else: Syntax.Else,
  mut: Syntax.Mut,
  println: Syntax.Println,
  undefined: Syntax.Undefined,
  null: Syntax.Null
}