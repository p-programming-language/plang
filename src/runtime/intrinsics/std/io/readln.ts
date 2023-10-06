import reader from "readline-sync";

import Intrinsic from "../../../values/intrinsic";
import UnionType from "../../../../code-analysis/type-checker/types/union-type";
import SingularType from "../../../../code-analysis/type-checker/types/singular-type";

export default class Readln extends Intrinsic.Function {
  public readonly argumentTypes = {
    prompt: new SingularType("string"),
    hideEchoBack: new UnionType([
      new SingularType("bool"),
      new SingularType("undefined")
    ])
  };
  public readonly returnType = new UnionType([
    new SingularType("string"),
    new SingularType("undefined")
  ]);

  public call(prompt: string, hideEchoBack = false): string {
    return reader.question(prompt, { hideEchoBack });
  }
}