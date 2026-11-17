import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { stripTypeScriptTypes } from "node:module";

test("bundled railway-function.tsx contains zero relative imports and valid TypeScript", () => {
  const bundlePath = path.resolve(import.meta.dirname, "..", "dist", "railway-function.tsx");
  assert.ok(fs.existsSync(bundlePath), "Expected dist/railway-function.tsx to exist");
  const code = fs.readFileSync(bundlePath, "utf8");
  const relativeImports = code.match(/^import\s+[\s\S]*?from\s+["']\.\.?\/[^"']+["']/gm);
  assert.equal(relativeImports, null);

  const jsCode = stripTypeScriptTypes(code, { mode: "strip" });
  assert.ok(jsCode.includes("Bun.serve"));
  const nonModuleJs = jsCode.replace(
    /^export\s+(?=(?:async\s+)?(?:function|const|let|var|class)\b)/gm,
    "",
  );
  assert.doesNotThrow(() => new vm.Script(nonModuleJs));
});
