import util from "util";
import PValue from "./value";

export class Range extends PValue {
  public constructor(
    public readonly minimum: number,
    public readonly maximum: number
  ) { super(); }

  public doesFit(n: number): boolean {
    return n >= this.minimum && n <= this.maximum;
  }

  public [util.inspect.custom](): string {
    return this.toString();
  }

  public toString(): string {
    return util.inspect(this.minimum) + ".." + util.inspect(this.maximum);
  }
}
