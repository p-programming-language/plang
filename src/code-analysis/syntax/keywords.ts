import Syntax from "./syntax-type";

export const KEYWORDS = {
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