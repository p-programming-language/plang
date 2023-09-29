import * as readline from 'readline';

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
