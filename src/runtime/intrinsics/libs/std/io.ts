import reader from "readline-sync";

import type { ValueType } from "../../../../code-analysis/type-checker";
import type { Type } from "../../../../code-analysis/type-checker/types/type";
import SingularType from "../../../../code-analysis/type-checker/types/singular-type";
import UnionType from "../../../../code-analysis/type-checker/types/union-type";
import Intrinsic from "../../../values/intrinsic";

export default class IOLib extends Intrinsic.Lib {
  public get propertyTypes(): Record<string, Type> {
    return {};
  }

  public get members(): Record<string, ValueType> {
    return {
      readln: new (class Readln extends Intrinsic.Function {
        public readonly name = "std::io.readln";
        public readonly returnType = new UnionType([
          new SingularType("string"),
          new SingularType("undefined")
        ]);
        public readonly argumentTypes = {
          prompt: new SingularType("string"),
          hideEchoBack: new UnionType([
            new SingularType("bool"),
            new SingularType("undefined")
          ])
        };

        public call(prompt: string, hideEchoBack = false): string {
          return reader.question(prompt, { hideEchoBack });
        }
      })()
    };
  }
}