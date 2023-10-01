import AST from "../parser/ast";

export default class TypeChecker implements AST.Visitor.Expression<void>, AST.Visitor.Statement<void> {
    public analyze(): void {

    }
}