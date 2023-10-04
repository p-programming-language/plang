// import { StringBuilder } from "../lib/utilities";
// import type { ValueType } from "../code-analysis/type-checker";
// import AST from "../code-analysis/parser/ast";

// import type { LiteralExpression } from "../code-analysis/parser/ast/expressions/literal";
// import type { ParenthesizedExpression } from "../code-analysis/parser/ast/expressions/parenthesized";
// import type { UnaryExpression } from "../code-analysis/parser/ast/expressions/unary";
// import type { BinaryExpression } from "../code-analysis/parser/ast/expressions/binary";
// import type { IdentifierExpression } from "../code-analysis/parser/ast/expressions/identifier";
// import type { CompoundAssignmentExpression } from "../code-analysis/parser/ast/expressions/compound-assignment";
// import type { VariableAssignmentExpression } from "../code-analysis/parser/ast/expressions/variable-assignment";
// import type { ExpressionStatement } from "../code-analysis/parser/ast/statements/expression";
// import type { VariableAssignmentStatement } from "../code-analysis/parser/ast/statements/variable-assignment";
// import type { VariableDeclarationStatement } from "../code-analysis/parser/ast/statements/variable-declaration";

// export default class CodeGenerator extends StringBuilder implements AST.Visitor.Expression<void>, AST.Visitor.Statement<void> {
//   public visitVariableDeclarationStatement(stmt: VariableDeclarationStatement): void {
//     throw new Error("Method not implemented.");
//   }
//   public visitVariableAssignmentStatement(stmt: VariableAssignmentStatement): void {
//     throw new Error("Method not implemented.");
//   }

//   public visitExpressionStatement(stmt: ExpressionStatement): void {
//     throw new Error("Method not implemented.");
//   }

//   public visitVariableAssignmentExpression(expr: VariableAssignmentExpression): void {
//     throw new Error("Method not implemented.");
//   }

//   public visitCompoundAssignmentExpression(expr: CompoundAssignmentExpression): void {
//     throw new Error("Method not implemented.");
//   }

//   public visitIdentifierExpression(expr: IdentifierExpression): void {
//     throw new Error("Method not implemented.");
//   }

//   public visitUnaryExpression(expr: UnaryExpression): void {
//     throw new Error("Method not implemented.");
//   }

//   public visitBinaryExpression(expr: BinaryExpression): void {
//     throw new Error("Method not implemented.");
//   }

//   public visitParenthesizedExpression(expr: ParenthesizedExpression): void {
//     throw new Error("Method not implemented.");
//   }

//   public visitLiteralExpression(expr: LiteralExpression<ValueType>): void {
//     throw new Error("Method not implemented.");
//   }

//   public walk<T extends AST.Expression | AST.Statement = AST.Expression | AST.Statement>(node: T): void {
//     node.accept(this);
//   }
// }