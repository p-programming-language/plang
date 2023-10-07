import { describe, it } from "mocha";
import { readFileSync, readdirSync } from "fs";
import path from "path";
import "should";

import { PError } from "../../src/errors";
import type { ValueType } from "../../src/code-analysis/type-checker";
import Interpreter from "../../src/runtime/interpreter";
import P from "../../tools/p";
import pkg = require("../../package.json");

PError.testing = true;

let p = new P("test");
function evaluate(source: string, createNewEnvironment = true): ValueType {
  const result = p.doString(source);
  if (createNewEnvironment)
    p.newHost();

  return result;
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
  it("evaluates binary expressions", () => {
    evaluate("5 + 2 * 3")?.should.equal(11);
    evaluate("5 ^ 2 * 2")?.should.equal(50);
    evaluate("false || true && false")?.should.be.false();
    evaluate("false || true && false")?.should.be.false();
    evaluate("1.0 == 1")?.should.be.true();
  });
  it("evaluates unary expressions", () => {
    evaluate("-(5 + 7)")?.should.equal(-12);
    evaluate("+2")?.should.equal(2);
    evaluate("!false")?.should.be.true();
    evaluate("!0")?.should.be.false();
    evaluate("!1")?.should.be.false();
    evaluate("!''")?.should.be.false();
    evaluate("~5")?.should.equal(-6);
    evaluate("#['a','b','c']")?.should.equal(3);
  });
  it("evaluates variable declarations & compound assignments", () => {
    evaluate("mut int x = 2", false)?.should.be.undefined();
    evaluate("++x", false)?.should.equal(3);
    evaluate("x += 7", false)?.should.equal(10);
    evaluate("x := 1")?.should.equal(1);
  });
  it("evaluates if statements", () => {
    evaluate("mut bool cool = true", false)?.should.be.undefined();
    evaluate("cool", false)?.should.equal(true);
    evaluate("if cool\n\tcool = false", false)?.should.be.undefined();
    evaluate("cool")?.should.equal(false);
  });
  it("evaluates while statements", () => {
    evaluate("mut int i = 0", false)?.should.be.undefined();
    evaluate("until i == 5\n\t++i", false)?.should.be.undefined();
    evaluate("i")?.should.equal(5);
  });
  it("evaluates indexing expressions", () => {
    evaluate("int[] nums = [1,2,3]; nums[1]")?.should.equal(2);
  });
  it("evaluates property assignment expressions", () => {
    evaluate("int[] nums = [1,2,3]; nums[1] = 5; nums[1]")?.should.equal(5);
  });
  it("evaluates call expressions", () => {
    evaluate("eval('1 + 2')")?.should.equal(3);
  });
  it("evaluates intrinsics", () => {
    evaluate("version$")?.should.equal("v" + pkg.version);
    evaluate("filename$")?.should.equal("test");
  });
  describe("evaluates general tests (tests/)", () => {
    testFiles.forEach((file) => {
      const filePath = path.join(testDirectory, file);
      runTestsForFile(filePath);
    });
  });
});