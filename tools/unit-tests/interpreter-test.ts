import { describe, it } from "mocha";
import { readFileSync, readdirSync } from "fs";
import path from "path";
import "should";

import { PError } from "../../src/errors";
import { TypeChecker, ValueType } from "../../src/code-analysis/type-checker";
import Parser from "../../src/code-analysis/parser";
import Resolver from "../../src/code-analysis/resolver";
import Binder from "../../src/code-analysis/type-checker/binder";
import Interpreter from "../../src/runtime/interpreter";

PError.testing = true;

function evaluate(source: string): ValueType {
  const parser = new Parser(source);
  const resolver = new Resolver;
  const binder = new Binder;
  const typeChecker = new TypeChecker;
  const interpreter = new Interpreter;
  const ast = parser.parse();
  resolver.resolve(ast);
  const boundAST = binder.bindStatements(ast);
  typeChecker.check(boundAST);
  return interpreter.evaluate(ast);
}

const testDirectory = "./tests/";
const testFiles = readdirSync(testDirectory)
  .filter(file => file.endsWith(".p"));

function runTestsForFile(filePath: string) {
  it(filePath, () => {
    const source = readFileSync(filePath, "utf-8");
    (() => evaluate(source)).should.not.throw();
  });
}

describe(Interpreter.name, () => {
  it("evaluates literals", () => {
    it("strings", () => {
      evaluate("'abc'")?.should.equal("abc");
    });
    it("integers", () => {
      evaluate("420")?.should.equal(420);
    });
    it("floats", () => {
      evaluate("69.420")?.should.equal(69.42);
    });
    it("booleans", () => {
      evaluate("true")?.should.equal(true);
    });
    it("arrays", () => {
      evaluate("[1,'a',true]")?.should.equal([1, "a", true]);
    });
  });
  describe("evaluates general tests (tests/)", () => {
    testFiles.forEach((file) => {
      const filePath = path.join(testDirectory, file);
      runTestsForFile(filePath);
    });
  });
});