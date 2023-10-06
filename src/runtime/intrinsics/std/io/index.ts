import Intrinsic from "../../../values/intrinsic";
import Readln from "./readln";

export default class IO extends Intrinsic.Lib {
  public inject(): void {
    this.intrinsics.defineFunction("readln", Readln);
  }
}