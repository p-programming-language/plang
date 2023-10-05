import { describe, it } from "mocha";
import { readFileSync, readdirSync } from "fs";
import path from "path";
import "should";

import { PError } from "../../src/errors";
import { TypeChecker } from "../../src/code-analysis/type-checker";
import Parser from "../../src/code-analysis/parser";
import Resolver from "../../src/code-analysis/resolver";
import Binder from "../../src/code-analysis/type-checker/binder";

PError.testing = true;

function getCheckFunction(source: string): () => void {
  const parser = new Parser(source);
  const resolver = new Resolver;
  const binder = new Binder;
  const typeChecker = new TypeChecker;
  const ast = parser.parse();
  resolver.resolve(ast);
  const boundAST = binder.bindStatements(ast);
  return () => typeChecker.check(boundAST);
}

const testDirectory = "./tests/";
const testFiles = readdirSync(testDirectory)
  .filter(file => file.endsWith(".p"));

function runTestsForFile(filePath: string) {
  it(filePath, () => {
    const source = readFileSync(filePath, "utf-8");
    const check = getCheckFunction(source);
    check.should.not.throw();
  });
}

describe(TypeChecker.name, () => {
  it("throws when declaring a variable with a mismatched type", () => {
    try {
      const check = getCheckFunction("string a = 2");
      check.should.throw("TypeError: Type 'int' is not assignable to 'string'");
    } catch (e) {}
    try {
      const check = getCheckFunction("int[] nums = ['a', 'b', 'c']");
      check.should.throw("TypeError: Type 'Array<string>' is not assignable to 'Array<int>'");
    } catch (e) {}
  });
  it("does not throw when assigning an empty array", () => {
    try {
      const check = getCheckFunction("int[] nums = []");
      check.should.not.throw();
    } catch (e) {}
  });
  it("throws when assigning to a variable with a mismatched type", () => {
    try {
      const check = getCheckFunction("int x = 1; x = 'abc'");
      check.should.throw("TypeError: Type 'string' is not assignable to 'int'");
    } catch (e) {}
  });
  describe("typechecks general tests (tests/)", () => {
    testFiles.forEach((file) => {
      const filePath = path.join(testDirectory, file);
      runTestsForFile(filePath);
    });
  });
});