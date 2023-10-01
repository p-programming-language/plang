import { describe } from "mocha";
import "should";

import { Token } from "../src/code-analysis/syntax/token";
import { Lexer } from "../src/code-analysis/syntax/lexer";
import Syntax from "../src/code-analysis/syntax/syntax-type";

function tokenize(source: string): Token[] {
  const lexer = new Lexer(source);
  return lexer.tokenize();
}

describe("Lexer", () => {
  it("tokenizes literals", () => {
    {
      const [token] = tokenize('"hello, world!"');
      token.lexeme.should.equal('"hello, world!"');
      token.value?.should.equal("hello, world!");
      token.syntax.should.equal(Syntax.STRING)
    }
    {
      const [token] = tokenize("'abcdef'");
      token.lexeme.should.equal("'abcdef'");
      token.value?.should.equal("abcdef");
      token.syntax.should.equal(Syntax.STRING)
    }
    {
      const [token] = tokenize("1234");
      token.lexeme.should.equal("1234");
      token.value?.should.equal(1234);
      token.syntax.should.equal(Syntax.INT)
    }
    {
      const [token] = tokenize("69.420");
      token.lexeme.should.equal("69.420");
      token.value?.should.equal(69.42);
      token.syntax.should.equal(Syntax.FLOAT)
    }
    {
      const [token] = tokenize("true");
      token.lexeme.should.equal("true");
      token.value?.should.equal(true);
      token.syntax.should.equal(Syntax.BOOLEAN)
    }
  });
  it("tokenizes identifiers", () => {
    {
      const [token] = tokenize("hello");
      token.lexeme.should.equal("hello");
      token.value?.should.equal(undefined);
      token.syntax.should.equal(Syntax.IDENTIFIER)
    }
    {
      const [token] = tokenize("abc123");
      token.lexeme.should.equal("abc123");
      token.value?.should.equal(undefined);
      token.syntax.should.equal(Syntax.IDENTIFIER)
    }
  });
  it("tokenizes keywords", () => {

  });
  it("tokenizes type keywords", () => {
    {
      const [token] = tokenize("string");
      token.lexeme.should.equal("string");
      token.value?.should.equal(undefined);
      token.syntax.should.equal(Syntax.STRING_TYPE)
    }
    {
      const [token] = tokenize("float");
      token.lexeme.should.equal("float");
      token.value?.should.equal(undefined);
      token.syntax.should.equal(Syntax.FLOAT_TYPE)
    }
    {
      const [token] = tokenize("int");
      token.lexeme.should.equal("int");
      token.value?.should.equal(undefined);
      token.syntax.should.equal(Syntax.INT_TYPE)
    }
    {
      const [token] = tokenize("bool");
      token.lexeme.should.equal("bool");
      token.value?.should.equal(undefined);
      token.syntax.should.equal(Syntax.BOOLEAN_TYPE)
    }
  });
})