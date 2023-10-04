#!/usr/bin/env node
import { clearScreen, readln } from "../src/lib/utilities";
import P from "./p";
import * as os from "os";

async function main() {
  const currentOS = os.platform();

  console.log(`prepl v0.1.5 on ${currentOS}`);

  const p = new P();
  while (true) {
    const code = await readln(">>> ");
    if(code == "clear") { 
      clearScreen();
    } else {
      if (!code.trim()) continue;
      const result = p.doString(code);
      console.log(result.toString())
    };
  }
}

main().catch((error) => {
  console.error("An error occurred:", error);
});
