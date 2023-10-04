import { describe, it } from "mocha";
import { readFileSync, readdirSync } from "fs";
import path from "path";
import "should";

import { Token } from "../../src/code-analysis/syntax/token";
import Lexer from "../../src/code-analysis/syntax/lexer";
import Syntax from "../../src/code-analysis/syntax/syntax-type";

function tokenize(source: string): Token[] {
  const lexer = new Lexer(source);
  (() => new Lexer(source).tokenize()).should.not.throw();
  return lexer.tokenize();
}

const testDirectory = "./tests/";
const testFiles = readdirSync(testDirectory)
  .filter(file => file.endsWith(".p"));

function runTestsForFile(filePath: string) {
  it(filePath, () => {
    const source = readFileSync(filePath, "utf-8");
    const tokenizeSource = () => tokenize(source);
    tokenizeSource.should.not.throw();
    const tokens = tokenizeSource();
    tokens.length.should.be.greaterThan(0);
  });
}

describe(Lexer.name, () => {
  it("tokenizes literals", () => {
    {
      const [token] = tokenize('"hello, world!"');
      token.lexeme.should.equal('"hello, world!"');
      token.value?.should.equal("hello, world!");
      token.syntax.should.equal(Syntax.String);
    }
    {
      const [token] = tokenize("123");
      token.lexeme.should.equal("123");
      token.value?.should.equal(123);
      token.syntax.should.equal(Syntax.Int);
    }
    {
      const [token] = tokenize("69.420");
      token.lexeme.should.equal("69.420");
      token.value?.should.equal(69.42);
      token.syntax.should.equal(Syntax.Float);
    }
    {
      const [token] = tokenize("null");
      token.lexeme.should.equal("null");
      token.value?.should.equal(null);
      token.syntax.should.equal(Syntax.Null);
    }
    {
      const [token] = tokenize("undefined");
      token.lexeme.should.equal("undefined");
      token.value?.should.equal(undefined);
      token.syntax.should.equal(Syntax.Undefined);
    }
  });
  it("tokenizes identifiers", () => {
    {
      const [token] = tokenize("hello");
      token.lexeme.should.equal("hello");
      token.value?.should.equal(undefined);
      token.syntax.should.equal(Syntax.Identifier);
    }
    {
      const [token] = tokenize("abc123");
      token.lexeme.should.equal("abc123");
      token.value?.should.equal(undefined);
      token.syntax.should.equal(Syntax.Identifier);
    }
  });
  it("tokenizes type keywords", () => {
    {
      const [token] = tokenize("string");
      token.lexeme.should.equal("string");
      token.value?.should.equal(undefined);
      token.syntax.should.equal(Syntax.StringType);
    }
    {
      const [token] = tokenize("int");
      token.lexeme.should.equal("int");
      token.value?.should.equal(undefined);
      token.syntax.should.equal(Syntax.IntType);
    }
    {
      const [token] = tokenize("void");
      token.lexeme.should.equal("void");
      token.value?.should.equal(undefined);
      token.syntax.should.equal(Syntax.VoidType);
    }
  });
  describe("tokenizes general tests (tests/)", () => {
    testFiles.forEach((file) => {
      const filePath = path.join(testDirectory, file);
      runTestsForFile(filePath);
    });
  });
});