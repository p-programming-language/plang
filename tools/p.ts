import { readFileSync } from "fs";
import Parser from "../src/code-analysis/parser";

namespace P {
  export function doString(source: string): void {
    const parser = new Parser(source);
    const ast = parser.parse();
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