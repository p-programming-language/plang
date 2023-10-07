import { describe, it } from "mocha";
import { readFileSync, readdirSync } from "fs";
import path from "path";
import "should";

import { BoundStatement } from "../../src/code-analysis/type-checker/binder/bound-node";
import Syntax from "../../src/code-analysis/tokenization/syntax-type";
import Binder from "../../src/code-analysis/type-checker/binder";
import SingularType from "../../src/code-analysis/type-checker/types/singular-type";
import FunctionType from "../../src/code-analysis/type-checker/types/function-type";
import P from "../../tools/p";

import BoundLiteralExpression from "../../src/code-analysis/type-checker/binder/bound-expressions/literal";
import BoundUnaryExpression from "../../src/code-analysis/type-checker/binder/bound-expressions/unary";
import BoundBinaryExpression from "../../src/code-analysis/type-checker/binder/bound-expressions/binary";
import BoundArrayLiteralExpression from "../../src/code-analysis/type-checker/binder/bound-expressions/array-literal";
import BoundExpressionStatement from "../../src/code-analysis/type-checker/binder/bound-statements/expression";
import BoundVariableDeclarationStatement from "../../src/code-analysis/type-checker/binder/bound-statements/variable-declaration";
import BoundIndexExpression from "../../src/code-analysis/type-checker/binder/bound-expressions";
import BoundIdentifierExpression from "../../src/code-analysis/type-checker/binder/bound-expressions/identifier";
import BoundCallExpression from "../../src/code-analysis/type-checker/binder/bound-expressions/call";

function bind(source: string): BoundStatement[] {
  const p = new P("test");
  const parser = p.createParser(source);
  const ast = parser.parse();
  return p.host.binder.bindStatements(ast);
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

describe(Binder.name, () => {
  it("binds literals", () => {
    it("strings", () => {
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
    });
    it("integers", () => {
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
    });
    it("arrays", () => {
      const [node] = bind("[1,'a',true]");
      node.should.be.an.instanceof(BoundExpressionStatement);
      const expr = (<BoundExpressionStatement>node).expression;
      expr.should.be.an.instanceof(BoundArrayLiteralExpression);
      const literal = <BoundArrayLiteralExpression>expr;
      literal.type.isUnion().should.be.true();
      literal.type.toString().should.equal("int | string | bool");
      const [one, two, three] = literal.elements;
      one.type.isSingular().should.be.true();
      one.type.toString().should.equal("int");
      one.token.syntax.should.equal(Syntax.Int);
      one.token.lexeme.should.equal("1");
      one.token.value?.should.equal(1);
      two.type.isSingular().should.be.true();
      two.type.toString().should.equal("string");
      two.token.syntax.should.equal(Syntax.String);
      two.token.lexeme.should.equal("'a'");
      two.token.value?.should.equal("a");
      three.type.isSingular().should.be.true();
      three.type.toString().should.equal("bool");
      three.token.syntax.should.equal(Syntax.Boolean);
      three.token.lexeme.should.equal("true");
      three.token.value?.should.equal(true);
    });
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
  it("binds indexing expressions", () => {
    {
      const [_, node] = bind("int[] myArr = [1,2,3,4]; myArr[3]");
      node.should.be.an.instanceof(BoundExpressionStatement);
      const expr = (<BoundExpressionStatement>node).expression;
      expr.should.be.an.instanceof(BoundIndexExpression);
      const indexing = <BoundIndexExpression>expr;
      indexing.object.should.be.an.instanceof(BoundIdentifierExpression);
      indexing.object.type.isSingular().should.be.true();
      const objectType = <SingularType>indexing.object.type;
      objectType.name.should.equal("Array");
      objectType.typeArguments![0].isSingular().should.be.true();
      (<SingularType>objectType.typeArguments![0]).name.should.equal("int");
      indexing.type.isSingular().should.be.true();
      (<SingularType>indexing.type).name.should.equal("int");
      (<BoundIdentifierExpression>indexing.object).name.lexeme.should.equal("myArr");
      indexing.index.should.be.an.instanceof(BoundLiteralExpression);
      const index = <BoundLiteralExpression>indexing.index;
      index.token.syntax.should.equal(Syntax.Int);
      index.token.value?.should.equal(3);
    }
  });
  it("binds call expressions", () => {
    {

      const [node] = bind("eval('1 + 1')");
      node.should.be.an.instanceof(BoundExpressionStatement);
      const expr = (<BoundExpressionStatement>node).expression;
      expr.should.be.an.instanceof(BoundCallExpression);
      const call = <BoundCallExpression>expr;
      call.callee.should.be.an.instanceof(BoundIdentifierExpression);
      call.callee.type.isFunction().should.be.true();
      const calleeType = <FunctionType>call.callee.type;
      calleeType.returnType.isSingular().should.be.true();
      (<SingularType>calleeType.returnType).name.should.equal("any");
      const [arg] = call.args;
      arg.should.be.an.instanceof(BoundLiteralExpression);
      const argLiteral = <BoundLiteralExpression>arg;
      argLiteral.token.value?.should.equal("1 + 1");
      argLiteral.type.isSingular().should.be.true();
      (<SingularType>argLiteral.type).name.should.equal("string");
    }
  });
  describe("binds general tests (tests/)", () => {
    testFiles.forEach((file) => {
      const filePath = path.join(testDirectory, file);
      runTestsForFile(filePath);
    });
  });
});