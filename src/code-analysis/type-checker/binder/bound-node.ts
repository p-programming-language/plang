import util from "util";
import type { Type } from "../types/type";


export abstract class BoundNode {
  public toString(): string {
    return util.inspect(this, { colors: true, compact: false });
  }
}

export abstract class BoundExpression extends BoundNode {
  public abstract type: Type;
}
export abstract class BoundStatement extends BoundNode {
  public abstract type?: Type;
}
