import { PError } from "../errors";
import type { Token } from "../code-analysis/tokenization/token";
import type { ValueType } from "../code-analysis/type-checker";

namespace HookedException {
  class HookedException extends PError {
    public constructor(token: Token) {
      super("HookedException", "(BUG)", token.locationSpan.start.line, token.locationSpan.start.column, true);
    }
  }

  export class Return<V extends ValueType = ValueType> extends HookedException {
    public constructor(
      token: Token,
      public readonly value: V
    ) { super(token); }
  }

  export class Break extends HookedException {
    public constructor(
      token: Token,
      public readonly loopLevel: number
    ) {
      super(token);
    }
  }

  export class Next extends HookedException {
    public constructor(
      token: Token,
      public readonly loopLevel: number
    ) {
      super(token);
    }
  }
}

export = HookedException;