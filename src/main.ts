import P from "../tools/p";

async function main() {
  const code = `
"hello" + "world"
  `;

  const p = new P("main.ts");
  p.doString(code);
}

main().catch((error) => {
  console.error("An error occurred:", error);
});
