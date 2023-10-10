import { platform } from "os";
import { execSync } from "child_process";
import toCamelCase from "to-camel-case";

import type { ValueType } from "../../../../../code-analysis/type-checker";
import type { Type } from "../../../../../code-analysis/type-checker/types/type";
import Intrinsic from "../../../../values/intrinsic";
import UnionType from "../../../../../code-analysis/type-checker/types/union-type";
import LiteralType from "../../../../../code-analysis/type-checker/types/literal-type";
import SingularType from "../../../../../code-analysis/type-checker/types/singular-type";

import EnvLib from "./env";

export default class SystemLib extends Intrinsic.Lib {
  public get propertyTypes(): Record<string, Type> {
    return {
      os: new UnionType([
        new LiteralType("aix"),
        new LiteralType("android"),
        new LiteralType("darwin"),
        new LiteralType("freebsd"),
        new LiteralType("haiku"),
        new LiteralType("linux"),
        new LiteralType("openbsd"),
        new LiteralType("sunos"),
        new LiteralType("win32"),
        new LiteralType("cygwin"),
        new LiteralType("netbsd")
      ])
    };
  }

  public get members(): Record<string, ValueType> {
    const libName = this.name;
    return {
      os: platform(),

      env: EnvLib,

      // Time since Unix epoch in seconds
      time: class Time extends Intrinsic.Function {
        public readonly name = `${libName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = new SingularType("int");
        public readonly argumentTypes = {};

        public call(): number {
          return Date.now() / 1000;
        }
      },
      // Executs a shell command
      exec: class Exec extends Intrinsic.Function {
        public readonly name = `${libName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = new SingularType("string");
        public readonly argumentTypes = { command: new SingularType("string") };

        public call(command: string): string {
          try {
            const output = execSync(command, { encoding: "utf-8" });
            return output;
          } catch (error: any) {
            return error;
          }
        }
      }
    };
  }
}
