const tsup = require("tsup");

void main();

async function main() {
  await tsup.build({
    entry: ["server.ts"],
    format: ["cjs"],
    minify: false,
    outDir: "dist",
    env: {
      NEXT_PUBLIC_IS_LOCAL: "1",
      NODE_ENV: "production",
    },
  });
}
