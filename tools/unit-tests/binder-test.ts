import { describe, it } from "mocha";
import { readFileSync, readdirSync } from "fs";
import path from "path";
import "should";

import { BoundStatement } from "../../src/code-analysis/type-checker/binder/bound-node";
import Syntax from "../../src/code-analysis/syntax/syntax-type";
import Parser from "../../src/code-analysis/parser";
import Binder from "../../src/code-analysis/type-checker/binder";
import BoundExpressionStatement from "../../src/code-analysis/type-checker/binder/bound-statements/expression";
import BoundLiteralExpression from "../../src/code-analysis/type-checker/binder/bound-expressions/literal";
import SingularType from "../../src/code-analysis/type-checker/types/singular-type";
import BoundUnaryExpression from "../../src/code-analysis/type-checker/binder/bound-expressions/unary";
import BoundBinaryExpression from "../../src/code-analysis/type-checker/binder/bound-expressions/binary";
import BoundVariableDeclarationStatement from "../../src/code-analysis/type-checker/binder/bound-statements/variable-declaration";

function bind(source: string): BoundStatement[] {
  const parser = new Parser(source);
  const binder = new Binder;
  const ast = parser.parse();
  return binder.bindStatements(ast);
}

const testDirectory = "./tests/";
const testFiles = readdirSync(testDirectory)
  .filter(file => file.endsWith(".p"));

function runTestsForFile(filePath: string) {
  it(filePath, () => {
    const source = readFileSync(filePath, "utf-8");
    const bindFile = () => bind(source);
    bindFile.should.not.throw();
  });
}

describe(Parser.name, () => {
  it("binds literals", () => {
    {
      const [node] = bind('"hello"');
      node.should.be.an.instanceof(BoundExpressionStatement);
      const expr = (<BoundExpressionStatement>node).expression;
      expr.should.be.an.instanceof(BoundLiteralExpression);
      expr.type.isSingular().should.be.true();
      const type = <SingularType>expr.type;
      type.name.should.equal("string");
      type.typeArguments?.should.be.undefined();
      expr.token.syntax.should.equal(Syntax.String);
      expr.token.lexeme.should.equal('"hello"');
      expr.token.value?.should.equal("hello");
    }
    {
      const [node] = bind("123");
      node.should.be.an.instanceof(BoundExpressionStatement);
      const expr = (<BoundExpressionStatement>node).expression;
      expr.should.be.an.instanceof(BoundLiteralExpression);
      expr.type.isSingular().should.be.true();
      const type = <SingularType>expr.type;
      type.name.should.equal("int");
      type.typeArguments?.should.be.undefined();
      expr.token.syntax.should.equal(Syntax.Int);
      expr.token.lexeme.should.equal("123");
      expr.token.value?.should.equal(123);
    }
  });
  it("binds unary expressions", () => {
    {
      const [node] = bind("!123");
      node.should.be.an.instanceof(BoundExpressionStatement);
      const expr = (<BoundExpressionStatement>node).expression;
      expr.should.be.an.instanceof(BoundUnaryExpression);
      const unary = <BoundUnaryExpression>expr;
      unary.operator.syntax.should.equal(Syntax.Bang);
      (<SingularType>unary.operator.resultType).name.should.equal("bool");
      (<SingularType>unary.operand.type).name.should.equal("int");
      unary.operand.token.syntax.should.equal(Syntax.Int)
      unary.operand.token.lexeme.should.equal("123");
      unary.operand.token.value?.should.equal(123);
    }
  });
  it("binds binary expressions", () => {
    {
      const [node] = bind("false && true");
      node.should.be.an.instanceof(BoundExpressionStatement);
      const expr = (<BoundExpressionStatement>node).expression;
      expr.should.be.an.instanceof(BoundBinaryExpression);
      const binary = <BoundBinaryExpression>expr;
      binary.operator.syntaxes.includes(Syntax.AmpersandAmpersand).should.be.true();
      (<SingularType>binary.operator.leftType).name.should.equal("any");
      (<SingularType>binary.operator.rightType).name.should.equal("any");
      (<SingularType>binary.operator.resultType).name.should.equal("bool");

      binary.left.should.be.an.instanceof(BoundLiteralExpression);
      (<SingularType>binary.left.type).name.should.equal("bool");
      binary.left.token.syntax.should.equal(Syntax.Boolean)
      binary.left.token.lexeme.should.equal("false");
      binary.left.token.value?.should.equal(false);
      binary.right.should.be.an.instanceof(BoundLiteralExpression);
      (<SingularType>binary.right.type).name.should.equal("bool");
      binary.right.token.syntax.should.equal(Syntax.Boolean)
      binary.right.token.lexeme.should.equal("true");
      binary.right.token.value?.should.equal(true);
    }
  });
  it("binds variable declaration statements", () => {
    {
      const [node] = bind("int y = 123");
      node.should.be.an.instanceof(BoundVariableDeclarationStatement);
      const declaration = <BoundVariableDeclarationStatement>node;
      declaration.symbol.name.lexeme.should.equal("y");
      (<SingularType>declaration.type).name.should.equal("int");
      declaration.initializer?.should.be.an.instanceof(BoundLiteralExpression);
      const value = <BoundLiteralExpression>declaration.initializer;
      value.token.syntax.should.equal(Syntax.Int);
      value.token.value?.should.equal(123);
    }
  });
  describe("binds general tests (tests/)", () => {
    testFiles.forEach((file) => {
      const filePath = path.join(testDirectory, file);
      runTestsForFile(filePath);
    });
  });
});