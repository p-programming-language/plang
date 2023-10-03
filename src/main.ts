import P from "../tools/p";
import Parser from "./code-analysis/parser";

async function main() {
  const code = `
"hello" + "world"
  `;

  const p = new P;
  p.doString(code);
}

main().catch((error) => {
  console.error("An error occurred:", error);
});
