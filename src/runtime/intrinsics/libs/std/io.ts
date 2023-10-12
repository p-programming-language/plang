import reader from "readline-sync";
import toCamelCase from "to-camel-case";

import type { ValueType } from "../../../../code-analysis/type-checker";
import type { Type } from "../../../../code-analysis/type-checker/types/type";
import { maybe } from "../../../../utility";
import SingularType from "../../../../code-analysis/type-checker/types/singular-type";
import Intrinsic from "../../../values/intrinsic";

export default class IOLib extends Intrinsic.Lib {
  public get propertyTypes(): Record<string, Type> {
    return {};
  }

  public get members(): Record<string, ValueType> {
    const libName = this.name;
    return {
      write: class Write extends Intrinsic.Function {
        public readonly name = `${libName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = new SingularType("void");
        public readonly argumentTypes = { message: new SingularType("any") };

        public call(message: any): void {
          process.stdout.write(message);
        }
      },
      writeln: class Writeln extends Intrinsic.Function {
        public readonly name = `${libName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = new SingularType("void");
        public readonly argumentTypes = { message: new SingularType("any") };

        public call(message: any): void {
          console.log(message);
        }
      },
      readln: class Readln extends Intrinsic.Function {
        public readonly name = `${libName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = maybe(new SingularType("string"));
        public readonly argumentTypes = {
          prompt: new SingularType("string"),
          hideEchoBack: maybe(new SingularType("bool"))
        };

        public call(prompt: string, hideEchoBack = false): string {
          return reader.question(prompt, { hideEchoBack });
        }
      }
    };
  }
}