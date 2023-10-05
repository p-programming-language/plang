import reader from "readline-sync";

import { Range } from "../../utility";
import Intrinsic from "../types/intrinsic";
import UnionType from "../../code-analysis/type-checker/types/union-type";
import SingularType from "../../code-analysis/type-checker/types/singular-type";

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

  public get arity(): Range {
    return new Range(1, 2);
  }

  public call(prompt: string, hideEchoBack = false): string {
    return reader.question(prompt, { hideEchoBack });
  }
}