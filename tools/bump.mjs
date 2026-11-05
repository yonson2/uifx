// Sets one version on all four packages and on the wrappers' core dependency (lockstep),
// then updates package-lock.json. Usage: npm run bump <x.y.z>

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(version ?? "")) throw new Error("usage: npm run bump <x.y.z>");

for (const dir of ["core", "react", "vue", "svelte"]) {
  const file = `packages/${dir}/package.json`;
  const pkg = JSON.parse(readFileSync(file, "utf8"));
  pkg.version = version;
  if (pkg.dependencies?.["@yonson2/uifx"]) pkg.dependencies["@yonson2/uifx"] = version;
  writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");
}
execFileSync("npm", ["install"], { stdio: "inherit" });
