import { readFileSync } from "fs";
import Parser from "../src/code-analysis/parser";
import Resolver from "../src/code-analysis/resolver";

namespace P {
  export function doString(source: string): void {
    const parser = new Parser(source);
    const resolver = new Resolver;
    const ast = parser.parse();
    resolver.resolveStatements(ast);
    console.log(ast.toString());
  }

  export function doFile(filePath: string): void {
    const fileContents = readFileSync(filePath, "utf-8");
    const lines = fileContents.split('\n');
    for (const line of lines) {
      doString(line);
    }
  }
}

export default P;