export default class ArrayStepper<T extends unknown = unknown> {
  protected position = 0;

  public constructor(
    public input?: ArrayLike<T>
  ) {}

  protected peek(offset = 1): T | undefined {
    const peekPosition = this.position + offset;
    return peekPosition + 1 > this.input!.length ? undefined : this.input![peekPosition];
  }

  protected get isFinished(): boolean {
    return this.position + 1 > this.input!.length;
  }

  protected get current(): T {
    return this.peek(0)!;
  }
}