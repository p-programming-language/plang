import reader from "readline-sync";
import toCamelCase from "to-camel-case";

import type { ValueType } from "../../../../code-analysis/type-checker";
import type { Type } from "../../../../code-analysis/type-checker/types/type";
import SingularType from "../../../../code-analysis/type-checker/types/singular-type";
import UnionType from "../../../../code-analysis/type-checker/types/union-type";
import Intrinsic from "../../../values/intrinsic";

export default class IOLib extends Intrinsic.Lib {
  public readonly name = `${this.parentName}.${toCamelCase(this.constructor.name.replace(/Lib/g, ""))}`;

  public get propertyTypes(): Record<string, Type> {
    return {};
  }

  public get members(): Record<string, ValueType> {
    const libName = this.name;
    return {
      readln: class Readln extends Intrinsic.Function {
        public readonly name = `${libName}.${toCamelCase(this.constructor.name)}`;
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
      }
    };
  }
}