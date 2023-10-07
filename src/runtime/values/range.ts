import util from "util";


export class Range {
  public constructor(
    public readonly minimum: number,
    public readonly maximum: number
  ) { }

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
