import reader from "readline-sync";

import { BoundNode } from "../../src/code-analysis/type-checker/binder/bound-node";
import { Type } from "../../src/code-analysis/type-checker/types/type";
import type P from "../p";
import AST from "../../src/code-analysis/parser/ast";

namespace ASTViewer {
  export function start(p: P): void {
    let option = undefined;
    while (option !== "bound" && option !== "regular")
      option = reader.question("Which AST do you want to view (regular/bound)? ").trim().toLowerCase();

    console.log(`Entering ${option === "bound" ? option : ""} AST viewer`.green.gray_bg(6));
    const source = reader.question("Input the source code you want to view the AST of: ").trim();
    const parser = p.createParser(source);
    const ast = parser.parse();
    if (option === "bound") {
      const boundAST = p.host.binder.bindStatements(ast);
      viewNodeList(boundAST);
    }
    else
      viewNodeList(ast);
  }

  function viewNodeList(nodes: (AST.Node | BoundNode)[]): void {
    while (true) {
      for (const node of nodes) {
        console.log(`${nodes.indexOf(node) + 1}: ${node}`);
        console.log();
      }

      console.log();
      let selectedNumber = undefined;
      while (selectedNumber !== "@back" && selectedNumber !== "@exit"
        && (
          !parseInt(selectedNumber ?? "")
          || !(!!parseInt(selectedNumber!)
            && parseInt(selectedNumber!) <= nodes.length
            && parseInt(selectedNumber!) > 0)
        )) {
        selectedNumber = reader.question(`Which element do you want to inspect (1-${nodes.length})? `, {});
      }

      if (selectedNumber === "@back" || selectedNumber === "@exit")
        break;

      viewObject(nodes[parseInt(selectedNumber!) - 1]);
    }
  }

  let lastObject: AST.Node | BoundNode | Type;
  function viewObject(object: AST.Node | BoundNode | Type) {
    console.log(object);
    console.log();

    while (true) {
      let propertyName = undefined;
      while (propertyName !== "@back" && !(propertyName! in object))
        propertyName = reader.question(`Which property of ${object.constructor.name} do you want to inspect? `);

      if (propertyName === "@back") {
        console.log(lastObject);
        console.log();
        break;
      }

      const value = object[<keyof (AST.Node | BoundNode | Type)>propertyName];
      if (value instanceof AST.Node || value instanceof BoundNode || value instanceof Type) {
        lastObject = object;
        viewObject(value);
      } else {
        console.log(value);
        console.log();
      }
    }
  }
}
export default ASTViewer;
