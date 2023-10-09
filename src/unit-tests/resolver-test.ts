import { describe, it } from "mocha";
import { readFileSync, readdirSync } from "fs";
import path from "path";
import "should";

import Resolver from "../../src/code-analysis/resolver";
import { PError } from "../../src/errors";
import P from "../../tools/p";

PError.testing = true;

function getResolveFunction(source: string): () => void {
  const p = new P("test");
  const parser = p.createParser(source);
  const { program: ast } = parser.parse();
  return () => p.host.resolver.resolve(ast);
}

const testDirectory = "./tests/";
const testFiles = readdirSync(testDirectory)
  .filter(file => file.endsWith(".p"));

function runTestsForFile(filePath: string) {
  it(filePath, () => {
    try {
      const source = readFileSync(filePath, "utf-8");
      const resolve = getResolveFunction(source);
      resolve.should.not.throw();
    } catch (e) {}
  });
}

describe(Resolver.name, () => {
  it("throws when referencing undefined variables", () => {
    try {
      const resolve = getResolveFunction("a = 2");
      resolve.should.throw("ResolutionError: 'a' is not defined in this scope");
    } catch (e) {}
  });
  it("throws when referencing variable in own initializer", () => {
    try {
      const resolve = getResolveFunction("int x = x");
      resolve.should.throw("ResolutionError: Cannot read variable 'x' in it's own initializer");
    } catch (e) {}
  });
  it("throws when attempting to redeclare variable in same scope", () => {
    try {
      const resolve = getResolveFunction("int y = 1; int y = 2");
      resolve.should.throw("ResolutionError: Variable 'y' is already declared is this scope");
    } catch (e) {}
  });
  describe("resolves general tests (tests/)", () => {
    testFiles.forEach((file) => {
      const filePath = path.join(testDirectory, file);
      runTestsForFile(filePath);
    });
  });
});