import { PError } from "../errors";
import type { Token } from "../code-analysis/syntax/token";
import type { ValueType } from "../code-analysis/type-checker";

namespace HookedException {
  class HookedException extends PError {
    public constructor(name: string, message: string, token: Token) {
      super(name, message, token.locationSpan.start.line, token.locationSpan.start.column);
    }
  }

  export class Return<V extends ValueType = ValueType> extends HookedException {
    public constructor(
      token: Token,
      public readonly value: V
    ) {
      super("InvalidReturn", "A return statement can only be used within a function body", token);
    }
  }

  export class Break extends HookedException {
    public constructor(token: Token) {
      super("InvalidBreak", "'break' can only be used within a loop", token);
    }
  }

  export class Next extends HookedException {
    public constructor(token: Token) {
      super("InvalidNext", "'next' can only be used within a loop", token);
    }
  }
}

export default HookedException;