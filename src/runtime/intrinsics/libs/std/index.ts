import Intrinsic from "../../../values/intrinsic";
import IO from "./io";

export default class Std extends Intrinsic.Lib {
  public inject(): void {
    (new IO(this.intrinsics)).inject();
  }
}