import Syntax from "./syntax-type";

export const KEYWORDS: Record<string, Syntax> = {

}


export const TYPE_KEYWORDS: Record<string, Syntax> = {
  string: Syntax.STRING_TYPE,
  int: Syntax.INT_TYPE,
  float: Syntax.FLOAT_TYPE,
  bool: Syntax.BOOLEAN_TYPE
}