import type { ValueType } from "../type-checker";
import type { Token } from "../tokenization/token";
import { ParserSyntaxError } from "../../errors";

import * as SyntaxSets from "../tokenization/syntax-sets";
import Syntax from "../tokenization/syntax-type";
import ArrayStepper from "../array-stepper";

type SyntaxSet = (typeof SyntaxSets)[keyof typeof SyntaxSets];

export default class TokenStepper extends ArrayStepper<Token> {
  protected consumeSemicolons(): void {
    while (this.match(Syntax.Semicolon));
  }

  /**
   * Expects `syntax` to exist, and throws if it does not
   *
   * Advances the parser if it does
   */
  protected consume<V extends ValueType = ValueType, S extends Syntax = Syntax>(syntax: Syntax, expectedOverride?: string): Token<V, S> {
    const gotSyntax = this.current ? Syntax[this.current.syntax] : "EOF";
    if (!this.match(syntax))
      throw new ParserSyntaxError(`Expected ${expectedOverride ?? `'${Syntax[syntax]}'`}, got ${gotSyntax}`, this.current);

    return this.previous<V, S>();
  }

  /**
   * Advances to the next token
   * @returns The previous token
   */
  protected advance<V extends ValueType = ValueType, S extends Syntax = Syntax>(): Token<V, S> {
    const token = this.current;
    if (!this.isFinished)
      this.position++;

    return <Token<V, S>>token;
  }

  /**
   * @returns The previous token
   */
  protected previous<V extends ValueType = ValueType, S extends Syntax = Syntax>(): Token<V, S> {
    return <Token<V, S>>this.peek(-1)!;
  }

  /**
   * Checks for a set of syntax types, and consumes it if one exists
   * @returns True if the current syntax matches any one syntax in `syntaxSet`
   */
  protected matchSet(syntaxSet: SyntaxSet): boolean {
    return this.match(...syntaxSet);
  }

  /**
   * Checks for a syntax type, and consumes it if it exists
   * @returns True if the current syntax matches any one syntax in `syntaxes`
   */
  protected match(...syntaxes: Syntax[]): boolean {
    for (const syntax of syntaxes)
      if (this.check(syntax)) {
        this.advance();
        return true;
      }

    return false;
  }

  /**
   * @returns True if the syntax at `offset` matches any one syntax in `syntaxes`
   */
  protected checkMultiple(syntaxes: Syntax[], offset = 0): boolean {
    for (const syntax of syntaxes)
      if (this.check(syntax, offset))
        return true;

    return false;
  }

  /**
   * @returns True if the syntax at `offset` matches `syntax`
   */
  protected check(syntax: Syntax, offset = 0): boolean {
    return this.peek(offset)?.syntax === syntax;
  }

  protected override get isFinished(): boolean {
    return this.check(Syntax.EOF);
  }
}