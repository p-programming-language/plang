import util from "util";
import { Token } from "../../syntax/token";

namespace AST {
  export abstract class Node {
    public abstract get token(): Token;

    public toString(): string {
      return util.inspect(this, { colors: true, compact: false });
    }
  }

  export abstract class Expression extends Node {}
  export abstract class Statement extends Node {}
}

export default AST;