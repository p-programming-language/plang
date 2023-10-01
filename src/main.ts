import Parser from "./code-analysis/parser";

async function main() {
    const code = `
"hello" + "world"
  `;

  const parser = new Parser(code);
  const ast = parser.parse();
  console.log(ast)
}

main().catch((error) => {
  console.error("An error occurred:", error);
});
