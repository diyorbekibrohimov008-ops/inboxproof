import type { DomainDiagnostics } from "../dns/diagnostics.ts";
import { buildRemediationPlan, type ProviderPreset, type RemediationPlan } from "../dns/remediation.ts";
import { analyzeSpamCopy, type CopyAnalysis } from "../copy/spam-analyzer.ts";

export interface ParsedEmailHeaders {
  fromDomain: string | null;
  returnPathDomain: string | null;
  dkimDomain: string | null;
  dkimSelector: string | null;
  spfResult: "pass" | "fail" | "softfail" | "none" | "unknown";
  dkimResult: "pass" | "fail" | "none" | "unknown";
  dmarcResult: "pass" | "fail" | "none" | "unknown";
  spfAligned: boolean;
  dkimAligned: boolean;
  subject: string | null;
  body: string;
}

export type PlacementFolder = "inbox" | "promotions" | "spam";

export interface SeedInboxResult {
  seedId: string;
  providerGroup:
    | "Google Workspace"
    | "Gmail Personal"
    | "Microsoft 365"
    | "Outlook / Hotmail"
    | "Yahoo / AOL"
    | "Regional ISPs";
  label: string;
  region: string;
  folder: PlacementFolder;
  reason: string;
}

export interface ProviderBreakdown {
  provider: string;
  totalSeeds: number;
  inbox: number;
  promotions: number;
  spam: number;
  inboxPct: number;
}

export interface PlacementReport {
  id: string;
  domain: string;
  fromEmail: string;
  providerPreset: ProviderPreset;
  telemetryMode: "predictive-seed-engine" | "header-telemetry-hybrid";
  summary: {
    inboxPct: number;
    promotionsPct: number;
    spamPct: number;
    grade: "A+" | "A" | "B" | "C" | "D" | "F";
  };
  diagnostics: DomainDiagnostics;
  remediation: RemediationPlan;
  copyAnalysis: CopyAnalysis;
  headerTelemetry: ParsedEmailHeaders | null;
  providerBreakdown: ProviderBreakdown[];
  seeds: SeedInboxResult[];
  createdAt: string;
}

function extractDomainFromHeaderVal(val: string | undefined): string | null {
  if (!val) return null;
  const angle = val.match(/<([^>]+)>/);
  const raw = (angle ? angle[1] : val).trim();
  const at = raw.lastIndexOf("@");
  if (at === -1) return null;
  return raw.slice(at + 1).replace(/[>;,\s].*$/, "").toLowerCase() || null;
}

export function parseEmailHeaders(rawEml: string): ParsedEmailHeaders {
  const splitIdx = rawEml.search(/\r?\n\r?\n/);
  const headerPart = splitIdx >= 0 ? rawEml.slice(0, splitIdx) : rawEml;
  const body = splitIdx >= 0 ? rawEml.slice(splitIdx).trim() : "";

  // Unfold RFC 5322 folded headers
  const unfolded = headerPart.replace(/\r?\n[ \t]+/g, " ");
  const lines = unfolded.split(/\r?\n/);

  const headers: Record<string, string[]> = {};
  for (const line of lines) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const name = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (!headers[name]) headers[name] = [];
    headers[name].push(value);
  }

  const fromDomain = extractDomainFromHeaderVal(headers["from"]?.[0]);
  const returnPathDomain = extractDomainFromHeaderVal(headers["return-path"]?.[0]);
  const dkimHeader = headers["dkim-signature"]?.[0] ?? "";
  const dkimDomain = dkimHeader.match(/(?:^|;\s*)d=([^;\s]+)/i)?.[1]?.toLowerCase() ?? null;
  const dkimSelector = dkimHeader.match(/(?:^|;\s*)s=([^;\s]+)/i)?.[1]?.toLowerCase() ?? null;

  const authResults = (headers["authentication-results"] ?? []).join(" ; ").toLowerCase();
  const spfMatch = authResults.match(/\bspf=(pass|fail|softfail|none|neutral|temperror|permerror)/);
  const dkimMatch = authResults.match(/\bdkim=(pass|fail|none|neutral|temperror|permerror)/);
  const dmarcMatch = authResults.match(/\bdmarc=(pass|fail|none)/);

  const normalizeRes = (m: string | undefined): "pass" | "fail" | "none" | "unknown" => {
    if (!m) return "unknown";
    if (m === "pass") return "pass";
    if (m === "none") return "none";
    return "fail";
  };

  const spfResult =
    spfMatch?.[1] === "softfail" ? "softfail" : normalizeRes(spfMatch?.[1]);
  const dkimResult = normalizeRes(dkimMatch?.[1]);
  const dmarcResult = normalizeRes(dmarcMatch?.[1]);

  const sameOrg = (a: string | null, b: string | null) =>
    Boolean(a && b && (a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`)));

  return {
    fromDomain,
    returnPathDomain,
    dkimDomain,
    dkimSelector,
    spfResult,
    dkimResult,
    dmarcResult,
    spfAligned: sameOrg(fromDomain, returnPathDomain),
    dkimAligned: sameOrg(fromDomain, dkimDomain),
    subject: headers["subject"]?.[0] ?? null,
    body,
  };
}

interface SeedProfile {
  seedId: string;
  providerGroup: SeedInboxResult["providerGroup"];
  label: string;
  region: string;
  spamSensitivity: number;
  promoSensitivity: number;
  requiresDmarc: boolean;
}

const GLOBAL_SEEDS: SeedProfile[] = [
  { seedId: "gw-us-1", providerGroup: "Google Workspace", label: "Google Workspace · US East", region: "US-East", spamSensitivity: 1.0, promoSensitivity: 0.35, requiresDmarc: true },
  { seedId: "gw-eu-2", providerGroup: "Google Workspace", label: "Google Workspace · Frankfurt", region: "EU-West", spamSensitivity: 1.05, promoSensitivity: 0.35, requiresDmarc: true },
  { seedId: "gw-ap-3", providerGroup: "Google Workspace", label: "Google Workspace · Singapore", region: "AP-South", spamSensitivity: 1.0, promoSensitivity: 0.3, requiresDmarc: true },
  { seedId: "gm-us-1", providerGroup: "Gmail Personal", label: "Gmail Consumer · US", region: "US-West", spamSensitivity: 1.1, promoSensitivity: 1.0, requiresDmarc: true },
  { seedId: "gm-uk-2", providerGroup: "Gmail Personal", label: "Gmail Consumer · London", region: "EU-North", spamSensitivity: 1.1, promoSensitivity: 0.95, requiresDmarc: true },
  { seedId: "gm-ca-3", providerGroup: "Gmail Personal", label: "Gmail Consumer · Toronto", region: "NA-North", spamSensitivity: 1.05, promoSensitivity: 0.9, requiresDmarc: true },
  { seedId: "m365-us-1", providerGroup: "Microsoft 365", label: "M365 Exchange Online · US", region: "US-Central", spamSensitivity: 1.15, promoSensitivity: 0.2, requiresDmarc: false },
  { seedId: "m365-eu-2", providerGroup: "Microsoft 365", label: "M365 Defender EOP · EU", region: "EU-Central", spamSensitivity: 1.2, promoSensitivity: 0.2, requiresDmarc: false },
  { seedId: "m365-uk-3", providerGroup: "Microsoft 365", label: "M365 Business · UK", region: "EU-UK", spamSensitivity: 1.1, promoSensitivity: 0.25, requiresDmarc: false },
  { seedId: "ol-us-1", providerGroup: "Outlook / Hotmail", label: "Outlook.com · US", region: "US-East", spamSensitivity: 1.15, promoSensitivity: 0.45, requiresDmarc: false },
  { seedId: "ol-gl-2", providerGroup: "Outlook / Hotmail", label: "Hotmail · Global", region: "EU-West", spamSensitivity: 1.15, promoSensitivity: 0.5, requiresDmarc: false },
  { seedId: "yh-us-1", providerGroup: "Yahoo / AOL", label: "Yahoo Mail · US", region: "US-West", spamSensitivity: 1.12, promoSensitivity: 0.7, requiresDmarc: true },
  { seedId: "yh-uk-2", providerGroup: "Yahoo / AOL", label: "Yahoo Mail · UK", region: "EU-UK", spamSensitivity: 1.1, promoSensitivity: 0.65, requiresDmarc: true },
  { seedId: "aol-us-3", providerGroup: "Yahoo / AOL", label: "AOL Mail · US", region: "US-East", spamSensitivity: 1.1, promoSensitivity: 0.6, requiresDmarc: true },
  { seedId: "reg-zoho", providerGroup: "Regional ISPs", label: "Zoho Mail · Global", region: "IN-West", spamSensitivity: 0.95, promoSensitivity: 0.4, requiresDmarc: false },
  { seedId: "reg-fast", providerGroup: "Regional ISPs", label: "Fastmail · Melbourne", region: "AU-East", spamSensitivity: 0.9, promoSensitivity: 0.2, requiresDmarc: false },
  { seedId: "reg-icloud", providerGroup: "Regional ISPs", label: "Apple iCloud Mail", region: "US-West", spamSensitivity: 1.05, promoSensitivity: 0.35, requiresDmarc: true },
  { seedId: "reg-gmx", providerGroup: "Regional ISPs", label: "GMX.de · Europe", region: "EU-DE", spamSensitivity: 1.0, promoSensitivity: 0.45, requiresDmarc: true },
];

function computeGrade(inboxPct: number): PlacementReport["summary"]["grade"] {
  if (inboxPct >= 93) return "A+";
  if (inboxPct >= 85) return "A";
  if (inboxPct >= 72) return "B";
  if (inboxPct >= 55) return "C";
  if (inboxPct >= 38) return "D";
  return "F";
}

export function runPlacementTest(params: {
  id?: string;
  diagnostics: DomainDiagnostics;
  subject: string;
  body: string;
  fromEmail?: string;
  providerPreset?: ProviderPreset;
  rawHeaders?: string;
}): PlacementReport {
  const { diagnostics, subject, body } = params;
  const providerPreset = params.providerPreset ?? "google-workspace";
  const fromEmail = params.fromEmail || `outreach@${diagnostics.domain}`;
  const remediation = buildRemediationPlan(diagnostics, { providerPreset, fromEmail });
  const copyAnalysis = analyzeSpamCopy(subject, body);
  const headerTelemetry = params.rawHeaders?.trim() ? parseEmailHeaders(params.rawHeaders) : null;

  // Base risk calculation (0..100 where higher = worse placement)
  let authRisk = 100 - diagnostics.authScore;
  if (headerTelemetry) {
    if (!headerTelemetry.dkimAligned) authRisk += 18;
    if (!headerTelemetry.spfAligned) authRisk += 10;
    if (headerTelemetry.dmarcResult === "fail") authRisk += 16;
  }

  const copySpamRisk = copyAnalysis.spamScore;

  const seeds: SeedInboxResult[] = GLOBAL_SEEDS.map((seed, idx) => {
    const providerAuthPenalty =
      seed.requiresDmarc && !diagnostics.dmarc.raw ? 20 : 0;
    const dkimPenalty = diagnostics.dkim.status === "fail" ? 26 : diagnostics.dkim.status === "warn" ? 6 : 0;
    const spfPenalty = diagnostics.spf.status === "fail" ? 22 : diagnostics.spf.status === "warn" ? 7 : 0;
    const linkPenalty =
      seed.providerGroup.startsWith("Microsoft") || seed.providerGroup.startsWith("Outlook")
        ? copyAnalysis.linkCount * 7
        : copyAnalysis.linkCount * 4;

    const jitter = ((idx * 7) % 9) - 4; // deterministic spread (-4..+4) across regional nodes
    const spamSignal =
      authRisk * 0.55 +
      copySpamRisk * 0.65 * seed.spamSensitivity +
      providerAuthPenalty +
      dkimPenalty * 0.35 +
      spfPenalty * 0.25 +
      linkPenalty +
      jitter;

    const promoSignal = copySpamRisk * seed.promoSensitivity + (copyAnalysis.linkCount >= 2 ? 18 : 0);

    let folder: PlacementFolder = "inbox";
    let reason = "Passed SPF, DKIM, and DMARC checks with clean 1:1 conversational copy.";

    if (spamSignal >= 48) {
      folder = "spam";
      if (diagnostics.dkim.status === "fail" || diagnostics.spf.status === "fail") {
        reason = "Authentication gaps (missing/invalid SPF or DKIM) combined with filter risk.";
      } else if (seed.requiresDmarc && !diagnostics.dmarc.raw) {
        reason = "Missing DMARC policy triggered strict 2024+ bulk sender enforcement.";
      } else if (copySpamRisk >= 40) {
        reason = "High-severity spam trigger words and aggressive sales formatting.";
      } else {
        reason = "Combined DNS warning and link/copy signals exceeded spam threshold.";
      }
    } else if (promoSignal >= 26 || (diagnostics.dmarc.policy === "none" && seed.promoSensitivity >= 0.9 && copySpamRisk >= 15)) {
      folder = "promotions";
      reason = "Authenticated, but promotional triggers or links routed message to Promotions/Other.";
    }

    return {
      seedId: seed.seedId,
      providerGroup: seed.providerGroup,
      label: seed.label,
      region: seed.region,
      folder,
      reason,
    };
  });

  const total = seeds.length;
  const inboxCount = seeds.filter((s) => s.folder === "inbox").length;
  const promoCount = seeds.filter((s) => s.folder === "promotions").length;

  const inboxPct = Math.round((inboxCount / total) * 100);
  const promotionsPct = Math.round((promoCount / total) * 100);
  const spamPct = Math.max(0, 100 - inboxPct - promotionsPct);

  const groups = Array.from(new Set(seeds.map((s) => s.providerGroup)));
  const providerBreakdown: ProviderBreakdown[] = groups.map((provider) => {
    const groupSeeds = seeds.filter((s) => s.providerGroup === provider);
    const inbox = groupSeeds.filter((s) => s.folder === "inbox").length;
    const promotions = groupSeeds.filter((s) => s.folder === "promotions").length;
    const spam = groupSeeds.filter((s) => s.folder === "spam").length;
    return {
      provider,
      totalSeeds: groupSeeds.length,
      inbox,
      promotions,
      spam,
      inboxPct: Math.round((inbox / groupSeeds.length) * 100),
    };
  });

  return {
    id: params.id ?? `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    domain: diagnostics.domain,
    fromEmail,
    providerPreset,
    telemetryMode: headerTelemetry ? "header-telemetry-hybrid" : "predictive-seed-engine",
    summary: {
      inboxPct,
      promotionsPct,
      spamPct,
      grade: computeGrade(inboxPct),
    },
    diagnostics,
    remediation,
    copyAnalysis,
    headerTelemetry,
    providerBreakdown,
    seeds,
    createdAt: new Date().toISOString(),
  };
}
