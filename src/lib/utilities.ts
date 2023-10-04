import * as readline from "readline";

export function readln(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise<string>((resolve) => {
    rl.question(prompt, (input) => {
      rl.close();
      resolve(input);
    });
  });
}

export class StringBuilder {
  protected indentation = 0;
  private readonly parts: string[] = [];

  public constructor(
    private readonly tabSize = 2
  ) { }

  protected get generated(): string {
    return this.parts.join("");
  }

  public append(...strings: string[]): void {
    this.parts.push(...strings);
  }

  protected peekLastPart(): string {
    return this.parts[this.parts.length - 1];
  }

  protected popLastPart(): string | undefined {
    return this.parts.pop();
  }

  protected pushIndentation(): void {
    this.indentation++;
  }

  protected popIndentation(): void {
    this.indentation--;
  }

  protected newLine(amount = 1): void {
    this.append(("\n" + " ".repeat(this.tabSize).repeat(this.indentation)).repeat(amount));
  }
}