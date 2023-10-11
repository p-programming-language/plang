import type { Token } from "../tokenization/token";
import type TypeTracker from "./type-tracker";
import type P from "../../../tools/p";
import { Parser } from ".";
import Syntax from "../tokenization/syntax-type";

export default class TypeAnalyzer extends Parser {
  public constructor(
    tokens: Token[],
    runner: P,
    public readonly typeTracker: TypeTracker,

  ) {

    super(tokens, runner);
    this.typeAnalyzer = this;
  }

  public analyze(): void {
    while (!this.isFinished)
      if (this.match(Syntax.Interface)) {
        this.declareTypeStub();
        const declaration = this.parseInterfaceType();
        this.consumeSemicolons();
        this.typeTracker.defineType(declaration.name.lexeme, declaration);
      } else if (this.match(Syntax.Class)) {
        this.declareTypeStub();
        const declaration = this.parseClassDeclaration();
        this.consumeSemicolons();
        this.typeTracker.defineType(declaration.name.lexeme, declaration.typeRef);
      } else if (this.check(Syntax.Identifier) && this.current.lexeme === "type") {
        const [name, aliasedType] = this.parseTypeAlias();
        this.consumeSemicolons();
        this.typeTracker.defineType(name.lexeme, aliasedType);
      } else
        this.advance();
  }

  private declareTypeStub(): void {
    const name = <Token<undefined, Syntax.Identifier>>this.current;
    if (name && name.syntax === Syntax.Identifier)
      this.typeTracker.declareType(name.lexeme);
  }
}