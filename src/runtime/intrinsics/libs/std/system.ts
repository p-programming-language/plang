import { platform } from "os";

import type { ValueType } from "../../../../code-analysis/type-checker";
import type { Type } from "../../../../code-analysis/type-checker/types/type";
import UnionType from "../../../../code-analysis/type-checker/types/union-type";
import Intrinsic from "../../../values/intrinsic";
import LiteralType from "../../../../code-analysis/type-checker/types/literal-type";

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
      os: platform()
    };
  }
}