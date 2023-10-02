#!/usr/bin/env node
import { readln } from "../src/lib/utilities";
import P from "./p";

async function main() {
  console.log("Welcome to the PLANG repl!");

  while (true) {
    const code = await readln("> ");
    if (!code.trim()) continue;
    P.doString(code);
  }
}

main().catch((error) => {
  console.error("An error occurred:", error);
});
