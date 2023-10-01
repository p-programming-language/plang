import AST from "../parser/ast";
import { LiteralExpression } from "../parser/ast/expressions/literal";
import { ParenthesizedExpression } from "../parser/ast/expressions/parenthesized";

export type ValueType = string | number | boolean | null | undefined;

export class TypeChecker implements AST.Visitor.Expression<void>, AST.Visitor.Statement<void> {
    public visitParenthesizedExpression(expr: ParenthesizedExpression): void {
        throw new Error("Method not implemented.");
    }

    public visitLiteralExpression(expr: LiteralExpression<ValueType>): void {
        throw new Error("Method not implemented.");
    }
}

