import { describe, it } from "mocha";
import fs from "fs";
import path from "path";
import "should";

import { LiteralExpression } from "../../src/code-analysis/parser/ast/expressions/literal";
import Parser from "../../src/code-analysis/parser";
import AST from "../../src/code-analysis/parser/ast";
import Syntax from "../../src/code-analysis/syntax/syntax-type";
import { UnaryExpression } from "../../src/code-analysis/parser/ast/expressions/unary";
import { BinaryExpression } from "../../src/code-analysis/parser/ast/expressions/binary";

function parse(source: string): AST.Node {
  const parser = new Parser(source);
  (() => new Parser(source).parse()).should.not.throw();
  return parser.parse();
}

const testDirectory = "./tests/";
const testFiles = fs
  .readdirSync(testDirectory)
  .filter((file) => file.endsWith(".p"));

function runTestsForFile(filePath: string) {
  it(filePath, () => {
    const sourceCode = fs.readFileSync(filePath, "utf-8");
    parse(sourceCode);
  });
}

describe("Parser", () => {
  it("parses literals", () => {
    {
      const node = parse('"hello"');
      node.should.be.an.instanceof(LiteralExpression);
      node.token.syntax.should.equal(Syntax.STRING)
      node.token.lexeme.should.equal('"hello"');
      node.token.value?.should.equal("hello");
    }
    {
      const node = parse("123");
      node.should.be.an.instanceof(LiteralExpression);
      node.token.syntax.should.equal(Syntax.INT)
      node.token.lexeme.should.equal("123");
      node.token.value?.should.equal(123);
    }
    {
      const node = parse("true");
      node.should.be.an.instanceof(LiteralExpression);
      node.token.syntax.should.equal(Syntax.BOOLEAN)
      node.token.lexeme.should.equal("true");
      node.token.value?.should.equal(true);
    }
    {
      const node = parse("null");
      node.should.be.an.instanceof(LiteralExpression);
      node.token.syntax.should.equal(Syntax.NULL)
      node.token.lexeme.should.equal("null");
      node.token.value?.should.equal(null);
    }
    {
      const node = parse("undefined");
      node.should.be.an.instanceof(LiteralExpression);
      node.token.syntax.should.equal(Syntax.UNDEFINED)
      node.token.lexeme.should.equal("undefined");
      node.token.value?.should.equal(undefined);
    }
  });
  it("parses unary expressions", () => {
    {
      const node = parse("!false");
      node.should.be.an.instanceof(UnaryExpression);
      const expr = <UnaryExpression>node;
      expr.operator.syntax.should.equal(Syntax.BANG);
      expr.operator.lexeme.should.equal("!");
      expr.operand.token.syntax.should.equal(Syntax.BOOLEAN)
      expr.operand.token.lexeme.should.equal("false");
      expr.operand.token.value?.should.equal(false);
    }
    {
      const node = parse("++6");
      node.should.be.an.instanceof(UnaryExpression);
      const expr = <UnaryExpression>node;
      expr.operator.syntax.should.equal(Syntax.PLUS_PLUS);
      expr.operator.lexeme.should.equal("++");
      expr.operand.token.syntax.should.equal(Syntax.INT)
      expr.operand.token.lexeme.should.equal("6");
      expr.operand.token.value?.should.equal(6);
    }
  });
  it("parses binary expressions", () => {
    {
      const node = parse("5 + 3 * 2");
      node.should.be.an.instanceof(BinaryExpression);
      const expr = <BinaryExpression>node;
      expr.operator.syntax.should.equal(Syntax.PLUS);
      expr.operator.lexeme.should.equal("+");
      expr.left.should.be.an.instanceof(LiteralExpression);
      expr.left.token.syntax.should.equal(Syntax.INT)
      expr.left.token.lexeme.should.equal("5");
      expr.left.token.value?.should.equal(5);
      expr.right.should.be.an.instanceof(BinaryExpression);
      const right = <BinaryExpression>expr.right;
      right.operator.syntax.should.equal(Syntax.STAR);
      right.operator.lexeme.should.equal("*");
      right.left.token.syntax.should.equal(Syntax.INT)
      right.left.token.lexeme.should.equal("3");
      right.left.token.value?.should.equal(3);
      right.right.token.syntax.should.equal(Syntax.INT)
      right.right.token.lexeme.should.equal("2");
      right.right.token.value?.should.equal(2);
    }
    // {
    //   const node = parse("false && true || false");
    //   node.should.be.an.instanceof(BinaryExpression);
    //   const expr = <BinaryExpression>node;
    // }
  });
  describe("parses general tests (tests/)", () => {
    testFiles.forEach((file) => {
      const filePath = path.join(testDirectory, file);
      runTestsForFile(filePath);
    });
  });
});