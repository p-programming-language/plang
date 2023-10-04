import { describe, it } from "mocha";
import fs from "fs";
import path from "path";
import "should";

import { LiteralExpression } from "../../src/code-analysis/parser/ast/expressions/literal";
import { UnaryExpression } from "../../src/code-analysis/parser/ast/expressions/unary";
import { BinaryExpression } from "../../src/code-analysis/parser/ast/expressions/binary";
import { ExpressionStatement } from "../../src/code-analysis/parser/ast/statements/expression";
import Syntax from "../../src/code-analysis/syntax/syntax-type";
import Parser from "../../src/code-analysis/parser";
import AST from "../../src/code-analysis/parser/ast";
import { VariableAssignmentStatement } from "../../src/code-analysis/parser/ast/statements/variable-assignment";
import { VariableAssignmentExpression } from "../../src/code-analysis/parser/ast/expressions/variable-assignment";
import { VariableDeclarationStatement } from "../../src/code-analysis/parser/ast/statements/variable-declaration";

function parse(source: string): AST.Statement[] {
  const parser = new Parser(source);
  return parser.parse();
}

const testDirectory = "./tests/";
const testFiles = fs
  .readdirSync(testDirectory)
  .filter((file) => file.endsWith(".p"));

function runTestsForFile(filePath: string) {
  it(filePath, () => {
    const sourceCode = fs.readFileSync(filePath, "utf-8");
    const parseFile = () => parse(sourceCode);
    parseFile.should.not.throw();
    parseFile();
  });
}

describe("Parser", () => {
  it("parses literals", () => {
    {
      const [node] = parse('"hello"');
      node.should.be.an.instanceof(ExpressionStatement);
      const expr = (<ExpressionStatement>node).expression;
      expr.should.be.an.instanceof(LiteralExpression);
      expr.token.syntax.should.equal(Syntax.String)
      expr.token.lexeme.should.equal('"hello"');
      expr.token.value?.should.equal("hello");
    }
    {
      const [node] = parse("123");
      node.should.be.an.instanceof(ExpressionStatement);
      const expr = (<ExpressionStatement>node).expression;
      expr.should.be.an.instanceof(LiteralExpression);
      expr.token.syntax.should.equal(Syntax.Int)
      expr.token.lexeme.should.equal("123");
      expr.token.value?.should.equal(123);
    }
    {
      const [node] = parse("true");
      node.should.be.an.instanceof(ExpressionStatement);
      const expr = (<ExpressionStatement>node).expression;
      expr.should.be.an.instanceof(LiteralExpression);
      expr.token.syntax.should.equal(Syntax.Boolean)
      expr.token.lexeme.should.equal("true");
      expr.token.value?.should.equal(true);
    }
    {
      const [node] = parse("null");
      node.should.be.an.instanceof(ExpressionStatement);
      const expr = (<ExpressionStatement>node).expression;
      expr.should.be.an.instanceof(LiteralExpression);
      expr.token.syntax.should.equal(Syntax.Null)
      expr.token.lexeme.should.equal("null");
      expr.token.value?.should.equal(null);
    }
    {
      const [node] = parse("undefined");
      node.should.be.an.instanceof(ExpressionStatement);
      const expr = (<ExpressionStatement>node).expression;
      expr.should.be.an.instanceof(LiteralExpression);
      expr.token.syntax.should.equal(Syntax.Undefined)
      expr.token.lexeme.should.equal("undefined");
      expr.token.value?.should.equal(undefined);
    }
  });
  it("parses unary expressions", () => {
    {
      const [node] = parse("!false");
      node.should.be.an.instanceof(ExpressionStatement);
      const expr = (<ExpressionStatement>node).expression;
      expr.should.be.an.instanceof(UnaryExpression);
      const unary = <UnaryExpression>expr;
      unary.operator.syntax.should.equal(Syntax.Bang);
      unary.operator.lexeme.should.equal("!");
      unary.operand.token.syntax.should.equal(Syntax.Boolean)
      unary.operand.token.lexeme.should.equal("false");
      unary.operand.token.value?.should.equal(false);
    }
    {
      const [node] = parse("++6");
      node.should.be.an.instanceof(ExpressionStatement);
      const expr = (<ExpressionStatement>node).expression;
      expr.should.be.an.instanceof(UnaryExpression);
      const unary = <UnaryExpression>expr;
      unary.operator.syntax.should.equal(Syntax.PlusPlus);
      unary.operator.lexeme.should.equal("++");
      unary.operand.token.syntax.should.equal(Syntax.Int)
      unary.operand.token.lexeme.should.equal("6");
      unary.operand.token.value?.should.equal(6);
    }
  });
  it("parses binary expressions", () => {
    {
      const [node] = parse("5 + 3 * 2");
      node.should.be.an.instanceof(ExpressionStatement);
      const expr = (<ExpressionStatement>node).expression;
      expr.should.be.an.instanceof(BinaryExpression);
      const binary = <BinaryExpression>expr;
      binary.operator.syntax.should.equal(Syntax.Plus);
      binary.operator.lexeme.should.equal("+");
      binary.left.should.be.an.instanceof(LiteralExpression);
      binary.left.token.syntax.should.equal(Syntax.Int)
      binary.left.token.lexeme.should.equal("5");
      binary.left.token.value?.should.equal(5);
      binary.right.should.be.an.instanceof(BinaryExpression);
      const right = <BinaryExpression>binary.right;
      right.operator.syntax.should.equal(Syntax.Star);
      right.operator.lexeme.should.equal("*");
      right.left.token.syntax.should.equal(Syntax.Int)
      right.left.token.lexeme.should.equal("3");
      right.left.token.value?.should.equal(3);
      right.right.token.syntax.should.equal(Syntax.Int)
      right.right.token.lexeme.should.equal("2");
      right.right.token.value?.should.equal(2);
    }
    {
      const [node] = parse("false && true || false");
      node.should.be.an.instanceof(ExpressionStatement);
      const expr = (<ExpressionStatement>node).expression;
      expr.should.be.an.instanceof(BinaryExpression);
      const binary = <BinaryExpression>expr;
      binary.operator.syntax.should.equal(Syntax.PipePipe);
      binary.operator.lexeme.should.equal("||");
      binary.left.should.be.an.instanceof(BinaryExpression);

      const left = <BinaryExpression>binary.left;
      left.operator.syntax.should.equal(Syntax.AmpersandAmpersand);
      left.operator.lexeme.should.equal("&&");
      left.left.token.syntax.should.equal(Syntax.Boolean)
      left.left.token.lexeme.should.equal("false");
      left.left.token.value?.should.equal(false);
      left.right.token.syntax.should.equal(Syntax.Boolean)
      left.right.token.lexeme.should.equal("true");
      left.right.token.value?.should.equal(true);

      binary.right.should.be.an.instanceof(LiteralExpression);
      binary.right.token.syntax.should.equal(Syntax.Boolean)
      binary.right.token.lexeme.should.equal("false");
      binary.right.token.value?.should.equal(false);
    }
  });
  it("parses variable assignment expressions", () => {
    {
      const [node] = parse("a = 2");
      node.should.be.an.instanceof(VariableAssignmentStatement);
      const assignment = <VariableAssignmentStatement>node;
      assignment.identifier.name.lexeme.should.equal("a");
      assignment.value.should.be.an.instanceof(LiteralExpression);
      const value = <LiteralExpression>assignment.value;
      value.token.syntax.should.equal(Syntax.Int);
      value.token.value?.should.equal(2);
    }
    {
      const [node] = parse("abc123 := '69420'");
      node.should.be.an.instanceof(ExpressionStatement);
      const expr = (<ExpressionStatement>node).expression;
      expr.should.be.an.instanceof(VariableAssignmentExpression);
      const assignment = <VariableAssignmentExpression>expr;
      assignment.identifier.name.lexeme.should.equal("abc123");
      assignment.value.should.be.an.instanceof(LiteralExpression);
      const value = <LiteralExpression>assignment.value;
      value.token.syntax.should.equal(Syntax.String);
      value.token.value?.should.equal("69420");
    }
  });
  it("parses variable declaration statements", () => {
    {
      const [node] = parse("int y = 123");
      node.should.be.an.instanceof(VariableDeclarationStatement);
      const declaration = <VariableDeclarationStatement>node;
      declaration.typeKeyword.syntax.should.equal(Syntax.IntType);
      declaration.typeKeyword.lexeme.should.equal("int");
      declaration.identifier.name.lexeme.should.equal("y");
      declaration.initializer?.should.be.an.instanceof(LiteralExpression);
      const value = <LiteralExpression>declaration.initializer;
      value.token.syntax.should.equal(Syntax.Int);
      value.token.value?.should.equal(123);
    }
    {
      const [node] = parse("string abc");
      node.should.be.an.instanceof(VariableDeclarationStatement);
      const declaration = <VariableDeclarationStatement>node;
      declaration.typeKeyword.syntax.should.equal(Syntax.StringType);
      declaration.typeKeyword.lexeme.should.equal("string");
      declaration.identifier.name.lexeme.should.equal("abc");
      declaration.initializer?.should.be.undefined();
    }
  });
  describe("parses general tests (tests/)", () => {
    testFiles.forEach((file) => {
      const filePath = path.join(testDirectory, file);
      runTestsForFile(filePath);
    });
  });
});