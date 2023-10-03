import { readFileSync } from "fs";
import Parser from "../src/code-analysis/parser";
import Resolver from "../src/code-analysis/resolver";
import { Binder } from "../src/code-analysis/type-checker/binder";
import { TypeChecker } from "../src/code-analysis/type-checker";

class P {
  private resolver = new Resolver;
  private binder = new Binder;
  private typeChecker = new TypeChecker;

  public doString(source: string): void {
    const parser = new Parser(source);
    const ast = parser.parse();
    this.resolver.resolve(ast);
    const boundAST = this.binder.bindStatements(ast);
    this.typeChecker.check(boundAST);
    console.log(boundAST.toString());
  }

  public doFile(filePath: string): void {
    const fileContents = readFileSync(filePath, "utf-8");
    const lines = fileContents.split("\n");

    // parsing, resolving, etc. for each line
    // is gonna annhilate performance kev
    for (const line of lines)
      this.doString(line);

    this.createResources();
  }

  private createResources(): void {
    this.resolver = new Resolver;
    this.binder = new Binder;
    this.typeChecker = new TypeChecker;
  }
}

export default P;