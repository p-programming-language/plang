import type { ValueType } from "../../../../code-analysis/type-checker";
import type { Type } from "../../../../code-analysis/type-checker/types/type";
import SingularType from "../../../../code-analysis/type-checker/types/singular-type";
import Intrinsic from "../../../values/intrinsic";

export default class ColorLib extends Intrinsic.Lib {
  private commonColors = [
    "black",
    "red",
    "green",
    "yellow",
    "blue",
    "magenta",
    "cyan",
    "white",
    "bbblack",
    "bbred",
    "bbgreen",
    "bbyellow",
    "bbblue",
    "bbmagenta",
    "bbcyan",
    "bbwhite",
  ];

  public get propertyTypes(): Record<string, Type> {
    const colorTypes: Record<string, Type> = {};
    for (const prefix of ["f", "b"]) {
      for (const color of this.commonColors) {
        const propertyName = `${prefix}${color}`;
        colorTypes[propertyName] = new SingularType("string");
      }
    }
    return colorTypes;
  }

  public get members(): Record<string, ValueType> {
    const colorEscapeCodes: Record<string, ValueType> = {};
    for (const prefix of ["f", "b"]) {
      for (const [index, color] of this.commonColors.entries()) {
        const propertyName = `${prefix}${color}`;
        colorEscapeCodes[propertyName] = `\x1b[${30 + (prefix === "b" ? 10 : 0) + index}m`;
      }
    }

    colorEscapeCodes["reset"] = "\x1b[0m";

    return colorEscapeCodes;
  }
}
