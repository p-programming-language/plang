import P from "../tools/p";
import Parser from "./code-analysis/parser";

async function main() {
    const code = `
"hello" + "world"
  `;

  P.doString(code);
}

main().catch((error) => {
  console.error("An error occurred:", error);
});
