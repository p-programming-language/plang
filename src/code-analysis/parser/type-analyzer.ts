import type { Token } from "../tokenization/token";
import type TypeTracker from "./type-tracker";
import TypeParser from "./type-parser";
import Syntax from "../tokenization/syntax-type";

export default class TypeAnalyzer extends TypeParser {
  protected readonly typeAnalyzer = this;

  public constructor(
    tokens: Token[],
    public readonly typeTracker: TypeTracker
  ) { super(tokens); }

  public analyze(): void {
    while (!this.isFinished)
      if (this.match(Syntax.Interface)) {
        const declaration = this.parseInterfaceType();
        this.consumeSemicolons();
        this.typeTracker.defineType(declaration.name.lexeme, declaration);
      } else
        this.advance();
  }
}