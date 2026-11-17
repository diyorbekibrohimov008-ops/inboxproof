import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { stripTypeScriptTypes } from "node:module";

const rootDir = path.resolve(import.meta.dirname, "..");
const outDir = path.join(rootDir, "dist");
const outFile = path.join(outDir, "railway-function.tsx");
const vercelOutFile = path.join(outDir, "vercel-api-index.js");

const coreModules = [
  "src/dns/diagnostics.ts",
  "src/dns/remediation.ts",
  "src/copy/spam-analyzer.ts",
  "src/placement/seed-engine.ts",
  "src/store/workspace-store.ts",
  "src/ui/app.ts",
  "src/server.ts",
];

const sourceOrder = [...coreModules, "src/railway-entry.ts"];

function stripRelativeImports(code) {
  // Remove single-line or multi-line relative imports: import ... from "./...";
  return code.replace(/^import\s+[\s\S]*?\s+from\s+["']\.\.?\/[^"']+["'];?\r?\n?/gm, "");
}

const sections = sourceOrder.map((relPath) => {
  const fullPath = path.join(rootDir, relPath);
  const raw = fs.readFileSync(fullPath, "utf8");
  const stripped = stripRelativeImports(raw).trim();
  return `// ===== ${relPath} =====\n${stripped}`;
});

const header = `// Auto-generated single-file Railway Function bundle for InboxProof
// Built from modular src/ sources via scripts/bundle-function.mjs
`;

const bundle = `${header}\n${sections.join("\n\n")}\n`;

// Sanity check: no relative imports left
const leftoverRelative = bundle.match(/^import\s+[\s\S]*?from\s+["']\.\.?\/[^"']+["']/gm);
if (leftoverRelative) {
  throw new Error(`Leftover relative imports detected:\n${leftoverRelative.join("\n")}`);
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, bundle, "utf8");
console.log(`Bundled ${sourceOrder.length} modules -> ${outFile} (${Buffer.byteLength(bundle, "utf8")} bytes)`);

// Also build modular zero-TS ESM files for Vercel deployment
const vercelDir = path.join(outDir, "vercel");
const b64Dir = path.join(outDir, "vercel-b64");
fs.rmSync(vercelDir, { recursive: true, force: true });
fs.rmSync(b64Dir, { recursive: true, force: true });
fs.mkdirSync(path.join(vercelDir, "src"), { recursive: true });
fs.mkdirSync(path.join(vercelDir, "api"), { recursive: true });
fs.mkdirSync(b64Dir, { recursive: true });

function compactStripPadding(code) {
  // Strip repeated horizontal spaces left by stripTypeScriptTypes while preserving strings/template literals.
  let out = "";
  let quote = null;
  let escaped = false;
  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    if (quote) {
      out += ch;
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === quote && quote !== "/") {
        quote = null;
      } else if (quote === "/" && ch === "/") {
        quote = null;
      }
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      quote = ch;
      out += ch;
      continue;
    }
    if (ch === "/" && i + 1 < code.length && code[i + 1] !== "/" && code[i + 1] !== "*") {
      const prev = out.trimEnd().slice(-1);
      if (!prev || "([=,:;!&|?+-*~^%{}\n".includes(prev)) {
        quote = "/";
        out += ch;
        continue;
      }
    }
    if (ch === " " || ch === "\t") {
      if (out.length > 0 && out[out.length - 1] !== " " && out[out.length - 1] !== "\n") {
        out += " ";
      }
      continue;
    }
    out += ch;
  }
  return out
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("//"))
    .join("\n");
}

function toCompactJs(tsSource) {
  const js = stripTypeScriptTypes(stripRelativeImports(tsSource), { mode: "strip" });
  return compactStripPadding(js);
}

// Keep src/part1-dns.mjs identical to pre-existing uploaded SHA when already compatible, using original spacing-free helper:
function toSimpleCompactJs(tsSource) {
  const js = stripTypeScriptTypes(stripRelativeImports(tsSource), { mode: "strip" });
  return js
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("//"))
    .join("\n");
}

const diagJs = toSimpleCompactJs(fs.readFileSync(path.join(rootDir, "src/dns/diagnostics.ts"), "utf8"));
const remJs = toSimpleCompactJs(fs.readFileSync(path.join(rootDir, "src/dns/remediation.ts"), "utf8"));
const part1Dns = `${diagJs}\n${remJs}\n`;

const vCopyRaw = `${toCompactJs(fs.readFileSync(path.join(rootDir, "src/copy/spam-analyzer.ts"), "utf8"))}\n`;
const vCopySplitRule = vCopyRaw.indexOf("{\npattern: /\\bfree\\b/");
const vCopyFnScan = vCopyRaw.indexOf("function scanTextTriggers(");
const vCopyFnAnalyze = vCopyRaw.indexOf("export function analyzeSpamCopy(");
const vCopyFnDet = vCopyRaw.indexOf("function rewriteSegmentDeterministically(");
const vCopyFnRewrite = vCopyRaw.indexOf("export function rewriteSpamCopy(");
const vCopyFnLlm = vCopyRaw.indexOf("export async function rewriteSpamCopyWithOptionalLlm(");
if ([vCopySplitRule, vCopyFnScan, vCopyFnAnalyze, vCopyFnDet, vCopyFnRewrite, vCopyFnLlm].some((n) => n === -1)) {
  throw new Error("Could not split v-copy cleanly");
}
const vCopy0 = `export ${vCopyRaw.slice(0, vCopySplitRule).replace(/^const SPAM_RULES =/, "const SPAM_RULES_A =").trimEnd()}\n];\n`;
const vCopy1Body = vCopyRaw.slice(vCopySplitRule, vCopyFnScan).trimEnd();
const vCopy1 = `export const SPAM_RULES_B = [\n${vCopy1Body.replace("const SAFE_ALL_CAPS_WHITELIST =", "export const SAFE_ALL_CAPS_WHITELIST =")}\n`;
const vCopy2 = `import { SPAM_RULES_A } from "./v-c0.mjs";\nimport { SPAM_RULES_B } from "./v-c1.mjs";\nimport { SAFE_ALL_CAPS_WHITELIST } from "./v-c1.mjs";\nconst SPAM_RULES = [...SPAM_RULES_A, ...SPAM_RULES_B];\nexport ${vCopyRaw.slice(vCopyFnScan, vCopyFnDet)}\n`;
const vCopy3 = `import { SAFE_ALL_CAPS_WHITELIST } from "./v-c1.mjs";\nexport ${vCopyRaw.slice(vCopyFnDet, vCopyFnRewrite)}\n`;
const vCopy4 = `import { scanTextTriggers, analyzeSpamCopy } from "./v-c2.mjs";\nimport { rewriteSegmentDeterministically } from "./v-c3.mjs";\n${vCopyRaw.slice(vCopyFnRewrite, vCopyFnLlm)}\n`;
const vCopy5 = `import { analyzeSpamCopy } from "./v-c2.mjs";\nimport { rewriteSpamCopy } from "./v-c4.mjs";\n${vCopyRaw.slice(vCopyFnLlm)}\n`;
const vCopyEntry = `export { analyzeSpamCopy } from "./v-c2.mjs";\nexport { rewriteSpamCopy } from "./v-c4.mjs";\nexport { rewriteSpamCopyWithOptionalLlm } from "./v-c5.mjs";\n`;

const vSeedRaw = `${toCompactJs(fs.readFileSync(path.join(rootDir, "src/placement/seed-engine.ts"), "utf8"))}\n`;
const vSeedMarker1 = vSeedRaw.indexOf("const GLOBAL_SEEDS = [");
const vSeedMidSeed = vSeedRaw.indexOf('{ seedId: "ol-us-1"');
const vSeedMarker2 = vSeedRaw.indexOf("export function runPlacementTest(");
const vSeedMapStart = vSeedRaw.indexOf("const seeds = GLOBAL_SEEDS.map(", vSeedMarker2);
const vSeedMapEnd = vSeedRaw.indexOf("const total = seeds.length;", vSeedMapStart);
if ([vSeedMarker1, vSeedMidSeed, vSeedMarker2, vSeedMapStart, vSeedMapEnd].some((n) => n === -1)) {
  throw new Error("Could not split v-seed cleanly");
}
const vSeed0 = `${vSeedRaw.slice(0, vSeedMarker1)}\n`;
const vSeed1a = `export const GLOBAL_SEEDS_A = [\n${vSeedRaw.slice(vSeedMarker1 + "const GLOBAL_SEEDS = [".length, vSeedMidSeed).trim()}\n];\n`;
const computeGradeIdx = vSeedRaw.indexOf("function computeGrade(", vSeedMidSeed);
const vSeed1b = `export const GLOBAL_SEEDS_B = [\n${vSeedRaw.slice(vSeedMidSeed, computeGradeIdx).trim()}\nexport ${vSeedRaw.slice(computeGradeIdx, vSeedMarker2).trim()}\n`;
const vSeed1Entry = `import { GLOBAL_SEEDS_A } from "./v-s1a.mjs";\nimport { GLOBAL_SEEDS_B, computeGrade } from "./v-s1b.mjs";\nexport const GLOBAL_SEEDS = [...GLOBAL_SEEDS_A, ...GLOBAL_SEEDS_B];\nexport { computeGrade };\n`;
const vSeed3 = `export function scoreGlobalSeeds(GLOBAL_SEEDS, diagnostics, authRisk, copyAnalysis) {\nconst copySpamRisk = copyAnalysis.spamScore;\nreturn ${vSeedRaw.slice(vSeedMapStart + "const seeds = ".length, vSeedMapEnd).trim()}\n}\n`;
const vSeed2 = `import { buildRemediationPlan } from "./part1-dns.mjs";\nimport { analyzeSpamCopy } from "./v-copy.mjs";\nimport { parseEmailHeaders } from "./v-s0.mjs";\nimport { GLOBAL_SEEDS, computeGrade } from "./v-s1.mjs";\nimport { scoreGlobalSeeds } from "./v-s3.mjs";\n${vSeedRaw.slice(vSeedMarker2, vSeedMapStart)}const seeds = scoreGlobalSeeds(GLOBAL_SEEDS, diagnostics, authRisk, copyAnalysis);\n${vSeedRaw.slice(vSeedMapEnd)}\n`;
const vSeedEntry = `export { parseEmailHeaders } from "./v-s0.mjs";\nexport { runPlacementTest } from "./v-s2.mjs";\n`;

const vStore = `${toCompactJs(fs.readFileSync(path.join(rootDir, "src/store/workspace-store.ts"), "utf8"))}\n`;

const uiRaw = fs.readFileSync(path.join(rootDir, "src/ui/app.ts"), "utf8");
const firstBacktick = uiRaw.indexOf("`");
const lastBacktick = uiRaw.lastIndexOf("`");
const rawTemplate = uiRaw.slice(firstBacktick + 1, lastBacktick);

const styleEndMarker = "</head>";
const rightPaneMarker = "<!-- RIGHT: RESULTS WORKBENCH -->";
const scriptStartMarker = "<script>";
const midScriptMarker = "function renderReport(report) {";

const styleEndPos = rawTemplate.indexOf(styleEndMarker);
const rightPanePos = rawTemplate.indexOf(rightPaneMarker);
const scriptStartPos = rawTemplate.indexOf(scriptStartMarker);
const midScriptPos = rawTemplate.indexOf(midScriptMarker, scriptStartPos);
if ([styleEndPos, rightPanePos, scriptStartPos, midScriptPos].some((n) => n === -1)) {
  throw new Error("Could not find expected UI split markers in src/ui/app.ts");
}

const compactHtml = (s) =>
  s
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("//"))
    .join("\n");

const compactCssHead = rawTemplate
  .slice(0, styleEndPos + styleEndMarker.length)
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean)
  .join(" ")
  .replace(/\s*([{};])\s*/g, "$1")
  .replace(/:\s+/g, ":");

const evalTpl = (t) => new Function(`return \`${t}\`;`)();
const fullHtml = [
  evalTpl(compactCssHead),
  evalTpl(compactHtml(rawTemplate.slice(styleEndPos + styleEndMarker.length, rightPanePos))),
  evalTpl(compactHtml(rawTemplate.slice(rightPanePos, scriptStartPos))),
  evalTpl(compactHtml(rawTemplate.slice(scriptStartPos, midScriptPos))),
  evalTpl(compactHtml(rawTemplate.slice(midScriptPos))),
].join("\n");

const uiChunkFiles = [];
const UI_SLICE_CHARS = 2100;
for (let i = 0, idx = 0; i < fullHtml.length; i += UI_SLICE_CHARS, idx++) {
  const slice = fullHtml.slice(i, i + UI_SLICE_CHARS);
  const name = `u-${String(idx).padStart(2, "0")}`;
  uiChunkFiles.push([name, `src/${name}.mjs`, `export const S = ${JSON.stringify(slice)};\n`]);
}

const vUiEntry = `${uiChunkFiles.map(([n], i) => `import { S as S${i} } from "./${n}.mjs";`).join("\n")}
export function renderAppHtml() {
  return ${uiChunkFiles.map((_, i) => `S${i}`).join(" + ")};
}
`;

const serverCompact = toCompactJs(fs.readFileSync(path.join(rootDir, "src/server.ts"), "utf8"));
const vServer = `import { createHybridResolver, diagnoseDomain } from "./part1-dns.mjs";
import { buildRemediationPlan } from "./part1-dns.mjs";
import { analyzeSpamCopy, rewriteSpamCopyWithOptionalLlm } from "./v-copy.mjs";
import { parseEmailHeaders, runPlacementTest } from "./v-seed.mjs";
import { createAutoWorkspaceStore } from "./v-store.mjs";
import { renderAppHtml } from "./v-ui.mjs";
${serverCompact}
`;

const apiIndexJs = `import { createAppHandler } from "../src/v-server.mjs";
const handleRequest = createAppHandler();
export async function GET(request) { return handleRequest(request); }
export async function POST(request) { return handleRequest(request); }
export async function PUT(request) { return handleRequest(request); }
export async function PATCH(request) { return handleRequest(request); }
export async function DELETE(request) { return handleRequest(request); }
export async function OPTIONS(request) { return handleRequest(request); }
`;

const vercelFiles = [
  ["src/part1-dns.mjs", part1Dns],
  ["src/v-c0.mjs", vCopy0],
  ["src/v-c1.mjs", vCopy1],
  ["src/v-c2.mjs", vCopy2],
  ["src/v-c3.mjs", vCopy3],
  ["src/v-c4.mjs", vCopy4],
  ["src/v-c5.mjs", vCopy5],
  ["src/v-copy.mjs", vCopyEntry],
  ["src/v-s0.mjs", vSeed0],
  ["src/v-s1a.mjs", vSeed1a],
  ["src/v-s1b.mjs", vSeed1b],
  ["src/v-s1.mjs", vSeed1Entry],
  ["src/v-s2.mjs", vSeed2],
  ["src/v-s3.mjs", vSeed3],
  ["src/v-seed.mjs", vSeedEntry],
  ["src/v-store.mjs", vStore],
  ["src/v-server.mjs", vServer],
  ...uiChunkFiles.map(([, rel, content]) => [rel, content]),
  ["src/v-ui.mjs", vUiEntry],
  ["api/index.js", apiIndexJs],
];

const manifest = [];
for (const [rel, content] of vercelFiles) {
  const full = path.join(vercelDir, rel);
  fs.writeFileSync(full, content, "utf8");
  const buf = Buffer.from(content, "utf8");
  const sha = crypto.createHash("sha1").update(buf).digest("hex");
  const b64Name = rel.replace(/[\/\\]/g, "_") + ".b64";
  const b64Path = path.join(b64Dir, b64Name);
  fs.writeFileSync(b64Path, buf.toString("base64"), "utf8");
  manifest.push({ file: rel, size: buf.length, sha, b64Length: buf.toString("base64").length, b64Name });
}
console.log("Vercel chunks:", JSON.stringify(manifest, null, 2));
