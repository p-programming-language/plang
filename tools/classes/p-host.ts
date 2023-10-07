import { TypeChecker } from "../../src/code-analysis/type-checker";
import type P from "../p";
import Lexer from "../../src/code-analysis/tokenization/lexer";
import TypeTracker from "../../src/code-analysis/parser/type-tracker";
import TypeAnalyzer from "../../src/code-analysis/parser/type-analyzer";
import Parser from "../../src/code-analysis/parser";
import Resolver from "../../src/code-analysis/resolver";
import Binder from "../../src/code-analysis/binder";
import Interpreter from "../../src/runtime/interpreter";

export default class PHost {
  private typeTracker = new TypeTracker;
  public resolver = new Resolver;
  public binder = new Binder;
  public typeChecker = new TypeChecker;
  public interpreter: Interpreter;

  public constructor(
    private readonly runner: P,
    fileName?: string
  ) {
    this.interpreter = new Interpreter(runner, this.resolver, this.binder, fileName)
  }

  public createParser(source: string): Parser {
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const typeAnalyzer = new TypeAnalyzer(tokens, this.typeTracker);
    typeAnalyzer.analyze();
    return new Parser(tokens, typeAnalyzer, this.runner);
  }
}