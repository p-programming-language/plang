import { TypeError } from "../errors";
import { StringBuilder } from "../lib/utilities";
import AST from "../code-analysis/parser/ast";

export default class Compiler extends StringBuilder implements AST.Visitor.Expression<void>, AST.Visitor.Statement<void> {
  public constructor(
    private readonly ast: AST.Node
  ) { super(); }

  public compile(): void {

  }
}