import P from "../tools/p";

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
