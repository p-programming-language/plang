import type { ValueType } from "../../../../code-analysis/type-checker";
import type { Type } from "../../../../code-analysis/type-checker/types/type";
import SingularType from "../../../../code-analysis/type-checker/types/singular-type";
import ArrayType from "../../../../code-analysis/type-checker/types/array-type"; // Import ArrayType
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
    "bright_black",
    "bright_red",
    "bright_green",
    "bright_yellow",
    "bright_blue",
    "bright_magenta",
    "bright_cyan",
    "bright_white",
  ];

  public get propertyTypes(): Record<string, Type> {
    const colorTypes: Record<string, Type> = {};
    const colors: Type = new ArrayType(new SingularType("string"));

    for (const prefix of ["f", "b"]) {
      for (const color of this.commonColors) {
        const propertyName = `${prefix}${color}`;
        colorTypes[propertyName] = new SingularType("string");
      }
    }

    return {
      ...colorTypes,
      colors,
    };
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

    const colors: string[] = this.commonColors; 

    return {
      ...colorEscapeCodes,
      colors,
    };
  }
}
