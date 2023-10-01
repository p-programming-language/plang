import { describe, it } from "mocha";
import fs from "fs";
import path from "path";
import "should";

import { Token } from "../src/code-analysis/syntax/token";
import Lexer from "../src/code-analysis/syntax/lexer";
import Syntax from "../src/code-analysis/syntax/syntax-type";

function tokenize(source: string): Token[] {
  const lexer = new Lexer(source);
  return lexer.tokenize();
}

const testDirectory = "./tests/";
const testFiles = fs
  .readdirSync(testDirectory)
  .filter((file) => file.endsWith(".p"));

function runTestsForFile(filePath: string) {
  try {
    it(filePath, () => {
      const sourceCode = fs.readFileSync(filePath, "utf-8");
      const tokens = tokenize(sourceCode);
    });
  } catch (error) {
    console.error(`Tests for ${filePath} failed:`, error);
  }
}

describe("Lexer", () => {
  it("tokenizes literals", () => {
    const [token] = tokenize('"hello, world!"');
    token.lexeme.should.equal('"hello, world!"');
    token.value?.should.equal("hello, world!");
    token.syntax.should.equal(Syntax.STRING);
  });
  it("tokenizes identifiers", () => {
    const [token] = tokenize("hello");
    token.lexeme.should.equal("hello");
    token.value?.should.equal(undefined);
    token.syntax.should.equal(Syntax.IDENTIFIER);
  });
  it("tokenizes type keywords", () => {
    const [token] = tokenize("string");
    token.lexeme.should.equal("string");
    token.value?.should.equal(undefined);
    token.syntax.should.equal(Syntax.STRING_TYPE);
  });
  it("tokenizes null types", () => {
    const [token] = tokenize("null");
    token.lexeme.should.equal("null");
    token.value?.should.equal(undefined);
    token.syntax.should.equal(Syntax.NULL);
  });
  it("tokenizes literals from literals.p", () => {
    const sourceCode = fs.readFileSync("./examples/literals.p", "utf-8");
    const tokens = tokenize(sourceCode);
    tokens.length.should.equal(7);
  });
});

describe("General Tests (tests/)", () => {
  testFiles.forEach((file) => {
    const filePath = path.join(testDirectory, file);
    runTestsForFile(filePath);
  });
});