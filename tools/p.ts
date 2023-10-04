import { readFileSync } from "fs";
import { TypeChecker } from "../src/code-analysis/type-checker";
import Parser from "../src/code-analysis/parser";
import Resolver from "../src/code-analysis/resolver";
import Binder from "../src/code-analysis/type-checker/binder";

export default class P {
  private resolver = new Resolver;
  private binder = new Binder;
  private typeChecker = new TypeChecker;

  public doString(source: string): any {
    const parser = new Parser(source);
    const ast = parser.parse();
    this.resolver.resolve(ast);
    const boundAST = this.binder.bindStatements(ast);
    this.typeChecker.check(boundAST);
    return ast
  }

  public doFile(filePath: string): any {
    const fileContents = readFileSync(filePath, "utf-8");
    const result = this.doString(fileContents);
    this.refreshResources();

    return result
  }

  private refreshResources(): void {
    this.resolver = new Resolver;
    this.binder = new Binder;
    this.typeChecker = new TypeChecker;
  }
}