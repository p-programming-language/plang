import { describe, it } from "mocha";
import fs from "fs";
import path from "path";
import "should";

import { Token } from "../src/code-analysis/syntax/token";
import Lexer from "../src/code-analysis/syntax/lexer";
import Syntax from "../src/code-analysis/syntax/syntax-type";

function tokenize(source: string): Token[] {
  const lexer = new Lexer(source);
  (() => new Lexer(source).tokenize()).should.not.throw();
  return lexer.tokenize();
}

const testDirectory = "./tests/";
const testFiles = fs
  .readdirSync(testDirectory)
  .filter((file) => file.endsWith(".p"));

function runTestsForFile(filePath: string) {
  it(filePath, () => {
    const sourceCode = fs.readFileSync(filePath, "utf-8");

    tokenize
    const tokens = tokenize(sourceCode);
    tokens.length.should.be.greaterThan(0);
  });
}

describe("Lexer", () => {
  it("tokenizes literals", () => {
    {
      const [token] = tokenize('"hello, world!"');
      token.lexeme.should.equal('"hello, world!"');
      token.value?.should.equal("hello, world!");
      token.syntax.should.equal(Syntax.STRING);
    }
    {
      const [token] = tokenize("123");
      token.lexeme.should.equal("123");
      token.value?.should.equal(123);
      token.syntax.should.equal(Syntax.INT);
    }
    {
      const [token] = tokenize("69.420");
      token.lexeme.should.equal("69.420");
      token.value?.should.equal(69.42);
      token.syntax.should.equal(Syntax.FLOAT);
    }
    {
      const [token] = tokenize("null");
      token.lexeme.should.equal("null");
      token.value?.should.equal(null);
      token.syntax.should.equal(Syntax.NULL);
    }
    {
      const [token] = tokenize("undefined");
      token.lexeme.should.equal("undefined");
      token.value?.should.equal(undefined);
      token.syntax.should.equal(Syntax.NULL);
    }
  });
  it("tokenizes identifiers", () => {
    {
      const [token] = tokenize("hello");
      token.lexeme.should.equal("hello");
      token.value?.should.equal(undefined);
      token.syntax.should.equal(Syntax.IDENTIFIER);
    }
    {
      const [token] = tokenize("abc123");
      token.lexeme.should.equal("abc123");
      token.value?.should.equal(undefined);
      token.syntax.should.equal(Syntax.IDENTIFIER);
    }
  });
  it("tokenizes type keywords", () => {
    {
      const [token] = tokenize("string");
      token.lexeme.should.equal("string");
      token.value?.should.equal(undefined);
      token.syntax.should.equal(Syntax.STRING_TYPE);
    }
    {
      const [token] = tokenize("int");
      token.lexeme.should.equal("int");
      token.value?.should.equal(undefined);
      token.syntax.should.equal(Syntax.INT_TYPE);
    }
    {
      const [token] = tokenize("void");
      token.lexeme.should.equal("void");
      token.value?.should.equal(undefined);
      token.syntax.should.equal(Syntax.VOID_TYPE);
    }
  });
  describe("tokenizes general tests (tests/)", () => {
    testFiles.forEach((file) => {
      const filePath = path.join(testDirectory, file);
      runTestsForFile(filePath);
    });
  });
});