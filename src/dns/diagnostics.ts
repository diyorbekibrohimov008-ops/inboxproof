export type CheckStatus = "pass" | "warn" | "fail";

export interface DiagnosticIssue {
  code: string;
  severity: "critical" | "warning" | "info";
  summary: string;
}

export interface MxRecord {
  exchange: string;
  priority: number;
}

export interface SpfDiagnostics {
  status: CheckStatus;
  raw: string | null;
  records: string[];
  lookupCount: number;
  includes: string[];
  qualifier: "+all" | "~all" | "-all" | "?all" | null;
  issues: DiagnosticIssue[];
}

export interface DkimDiagnostics {
  status: CheckStatus;
  selector: string;
  checkedSelectors: string[];
  raw: string | null;
  cnameTarget: string | null;
  estimatedBits: number;
  issues: DiagnosticIssue[];
}

export interface DmarcDiagnostics {
  status: CheckStatus;
  raw: string | null;
  policy: "none" | "quarantine" | "reject" | null;
  subdomainPolicy: "none" | "quarantine" | "reject" | null;
  pct: number;
  adkim: "r" | "s";
  aspf: "r" | "s";
  rua: string[];
  issues: DiagnosticIssue[];
}

export interface DomainDiagnostics {
  domain: string;
  detectedProvider: string;
  mx: {
    status: CheckStatus;
    records: MxRecord[];
    issues: DiagnosticIssue[];
  };
  spf: SpfDiagnostics;
  dkim: DkimDiagnostics;
  dmarc: DmarcDiagnostics;
  bimi: {
    present: boolean;
    raw: string | null;
  };
  dnsbl: {
    checked: boolean;
    listedOn: string[];
  };
  authScore: number;
  checkedAt: string;
}

export interface DnsResolver {
  queryTxt(name: string): Promise<string[]>;
  queryMx(name: string): Promise<MxRecord[]>;
  queryCname(name: string): Promise<string[]>;
  queryA(name: string): Promise<string[]>;
}

const COMMON_DKIM_SELECTORS = [
  "google",
  "s1",
  "s2",
  "selector1",
  "selector2",
  "k1",
  "dkim",
  "default",
  "mail",
  "resend",
  "pm",
  "em1",
];

const HOSTNAME_RE =
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

export function extractDomain(input: string): string {
  let raw = (input || "").trim();
  const angleMatch = raw.match(/<([^>]+)>/);
  if (angleMatch) {
    raw = angleMatch[1].trim();
  }
  if (raw.includes("@")) {
    raw = raw.split("@").pop() ?? "";
  }
  raw = raw.replace(/^https?:\/\//i, "").split("/")[0].split("?")[0].split(":")[0];
  raw = raw.replace(/\.+$/, "").trim().toLowerCase();

  if (!raw || !HOSTNAME_RE.test(raw)) {
    throw new Error(`Invalid domain or email address: "${input}"`);
  }
  return raw;
}

function unquoteTxt(data: string): string {
  const trimmed = data.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed
      .slice(1, -1)
      .replace(/"\s+"/g, "")
      .replace(/\\"/g, '"');
  }
  return trimmed.replace(/"\s+"/g, "");
}

interface DohAnswer {
  name?: string;
  type?: number;
  data?: string;
}

interface DohResponse {
  Status?: number;
  Answer?: DohAnswer[];
}

async function fetchDohEndpoint(url: string, timeoutMs: number): Promise<DohAnswer[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/dns-json" },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`DoH HTTP ${res.status}`);
    }
    const json = (await res.json()) as DohResponse;
    if (json.Status === 0 || json.Status === 3) {
      return json.Answer ?? [];
    }
    throw new Error(`DoH status ${json.Status ?? "unknown"}`);
  } finally {
    clearTimeout(timer);
  }
}

async function fetchDoh(name: string, type: string): Promise<DohAnswer[]> {
  const endpoints = [
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`,
    `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`,
  ];

  try {
    return await Promise.any(endpoints.map((url) => fetchDohEndpoint(url, 3000)));
  } catch {
    return [];
  }
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(Object.assign(new Error("DNS lookup timeout"), { code: "ETIMEOUT" })),
          ms,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

interface NodeDnsModule {
  resolveTxt(hostname: string): Promise<string[][]>;
  resolveMx(hostname: string): Promise<Array<{ exchange: string; priority: number }>>;
  resolveCname(hostname: string): Promise<string[]>;
  resolve4(hostname: string): Promise<string[]>;
}

const DEFINITIVE_NO_RECORD_CODES = new Set(["ENODATA", "ENOTFOUND", "ENONAME", "EREFUSED"]);

function isNoRecordDnsError(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  return typeof code === "string" && DEFINITIVE_NO_RECORD_CODES.has(code);
}

const NODE_DNS_TIMEOUT_MS = 20_000;

export function createHybridResolver(): DnsResolver {
  const doh = createDohResolver();
  let dnsModPromise: Promise<NodeDnsModule | null> | null = null;

  function getNodeDns(): Promise<NodeDnsModule | null> {
    if (!dnsModPromise) {
      dnsModPromise = import("node:dns/promises")
        .then((m) => m as unknown as NodeDnsModule)
        .catch(() => null);
    }
    return dnsModPromise;
  }

  async function resolveWithFallback<T>(
    nodeLookup: (dns: NodeDnsModule) => Promise<T[]>,
    dohFallback: () => Promise<T[]>,
  ): Promise<T[]> {
    const dns = await getNodeDns();
    if (dns) {
      try {
        return await withTimeout(nodeLookup(dns), NODE_DNS_TIMEOUT_MS);
      } catch (err) {
        if (isNoRecordDnsError(err)) return [];
      }
    }
    return dohFallback();
  }

  return {
    queryTxt(name: string): Promise<string[]> {
      return resolveWithFallback(
        (dns) => dns.resolveTxt(name).then((rows) => rows.map((chunks) => chunks.join(""))),
        () => doh.queryTxt(name),
      );
    },
    queryMx(name: string): Promise<MxRecord[]> {
      return resolveWithFallback(
        (dns) =>
          dns.resolveMx(name).then((rows) =>
            rows
              .map((r) => ({
                exchange: r.exchange.replace(/\.$/, "").toLowerCase(),
                priority: r.priority,
              }))
              .sort((a, b) => a.priority - b.priority),
          ),
        () => doh.queryMx(name),
      );
    },
    queryCname(name: string): Promise<string[]> {
      return resolveWithFallback(
        (dns) => dns.resolveCname(name).then((rows) => rows.map((r) => r.replace(/\.$/, "").toLowerCase())),
        () => doh.queryCname(name),
      );
    },
    queryA(name: string): Promise<string[]> {
      return resolveWithFallback(
        (dns) => dns.resolve4(name),
        () => doh.queryA(name),
      );
    },
  };
}

export function createDohResolver(): DnsResolver {
  return {
    async queryTxt(name: string): Promise<string[]> {
      const answers = await fetchDoh(name, "TXT");
      return answers
        .filter((a) => a.type === 16 && typeof a.data === "string")
        .map((a) => unquoteTxt(a.data!));
    },
    async queryMx(name: string): Promise<MxRecord[]> {
      const answers = await fetchDoh(name, "MX");
      return answers
        .filter((a) => a.type === 15 && typeof a.data === "string")
        .map((a) => {
          const parts = a.data!.trim().split(/\s+/);
          const priority = Number(parts[0] ?? 10);
          const exchange = (parts[1] ?? "").replace(/\.$/, "").toLowerCase();
          return { priority: Number.isFinite(priority) ? priority : 10, exchange };
        })
        .filter((r) => r.exchange.length > 0)
        .sort((a, b) => a.priority - b.priority);
    },
    async queryCname(name: string): Promise<string[]> {
      const answers = await fetchDoh(name, "CNAME");
      return answers
        .filter((a) => a.type === 5 && typeof a.data === "string")
        .map((a) => a.data!.replace(/\.$/, "").toLowerCase());
    },
    async queryA(name: string): Promise<string[]> {
      const answers = await fetchDoh(name, "A");
      return answers
        .filter((a) => a.type === 1 && typeof a.data === "string")
        .map((a) => a.data!.trim());
    },
  };
}

export function analyzeSpf(txtRecords: string[]): SpfDiagnostics {
  const spfRecords = txtRecords.filter((r) => /^v=spf1(\s|$)/i.test(r.trim()));
  const issues: DiagnosticIssue[] = [];

  if (spfRecords.length === 0) {
    issues.push({
      code: "SPF_MISSING",
      severity: "critical",
      summary: "No SPF record found on this domain.",
    });
    return {
      status: "fail",
      raw: null,
      records: [],
      lookupCount: 0,
      includes: [],
      qualifier: null,
      issues,
    };
  }

  if (spfRecords.length > 1) {
    issues.push({
      code: "SPF_MULTIPLE_RECORDS",
      severity: "critical",
      summary: `Found ${spfRecords.length} separate SPF records. Receivers reject mail when more than one v=spf1 record exists.`,
    });
  }

  const primary = spfRecords[0].trim();
  const tokens = primary.split(/\s+/).slice(1);
  const includes: string[] = [];
  let lookupCount = 0;
  let qualifier: SpfDiagnostics["qualifier"] = null;
  let hasPtr = false;

  for (const rawToken of tokens) {
    const token = rawToken.toLowerCase();
    const bare = token.replace(/^[+\-~?]/, "");

    if (bare.startsWith("include:")) {
      lookupCount += 1;
      includes.push(bare.slice("include:".length));
    } else if (bare.startsWith("redirect=")) {
      lookupCount += 1;
    } else if (bare === "a" || bare.startsWith("a:") || bare.startsWith("a/")) {
      lookupCount += 1;
    } else if (bare === "mx" || bare.startsWith("mx:") || bare.startsWith("mx/")) {
      lookupCount += 1;
    } else if (bare.startsWith("exists:")) {
      lookupCount += 1;
    } else if (bare === "ptr" || bare.startsWith("ptr:")) {
      lookupCount += 1;
      hasPtr = true;
    }

    if (token === "+all" || token === "all") {
      qualifier = "+all";
    } else if (token === "~all") {
      qualifier = "~all";
    } else if (token === "-all") {
      qualifier = "-all";
    } else if (token === "?all") {
      qualifier = "?all";
    }
  }

  if (lookupCount > 10) {
    issues.push({
      code: "SPF_TOO_MANY_LOOKUPS",
      severity: "critical",
      summary: `SPF requires ${lookupCount} DNS lookups, exceeding the 10-lookup limit.`,
    });
  } else if (lookupCount >= 8) {
    issues.push({
      code: "SPF_NEAR_LOOKUP_LIMIT",
      severity: "warning",
      summary: `SPF uses ${lookupCount}/10 allowed DNS lookups. Adding one more tool could break authentication.`,
    });
  }

  if (qualifier === "+all") {
    issues.push({
      code: "SPF_PERMISSIVE_ALL",
      severity: "critical",
      summary: "SPF ends with +all, allowing any server on the internet to spoof your domain.",
    });
  } else if (qualifier === "?all") {
    issues.push({
      code: "SPF_NEUTRAL_ALL",
      severity: "warning",
      summary: "SPF ends with ?all (neutral), which offers weak spoofing protection.",
    });
  } else if (!qualifier) {
    issues.push({
      code: "SPF_NO_ALL",
      severity: "warning",
      summary: "SPF record has no ending ~all or -all enforcement rule.",
    });
  }

  if (hasPtr) {
    issues.push({
      code: "SPF_PTR_DEPRECATED",
      severity: "warning",
      summary: "SPF uses the deprecated ptr mechanism, which slows down verification.",
    });
  }

  const hasCritical = issues.some((i) => i.severity === "critical");
  const hasWarn = issues.some((i) => i.severity === "warning");
  return {
    status: hasCritical ? "fail" : hasWarn ? "warn" : "pass",
    raw: primary,
    records: spfRecords,
    lookupCount,
    includes,
    qualifier,
    issues,
  };
}

export function analyzeDkim(
  selector: string,
  txtRecords: string[],
  cnameTarget: string | null = null,
): DkimDiagnostics {
  const issues: DiagnosticIssue[] = [];
  const dkimRecord = txtRecords.find((r) => /v=DKIM1|p=/i.test(r)) ?? null;

  if (!dkimRecord) {
    issues.push({
      code: "DKIM_MISSING",
      severity: "critical",
      summary: `No active DKIM key found for selector "${selector}".`,
    });
    return {
      status: "fail",
      selector,
      checkedSelectors: [selector],
      raw: null,
      cnameTarget,
      estimatedBits: 0,
      issues,
    };
  }

  const pMatch = dkimRecord.match(/(?:^|;\s*)p=([^;]*)/i);
  const publicKey = (pMatch?.[1] ?? "").replace(/\s+/g, "");

  if (!publicKey) {
    issues.push({
      code: "DKIM_REVOKED",
      severity: "critical",
      summary: `DKIM selector "${selector}" has an empty p= value, meaning the key is revoked or incomplete.`,
    });
    return {
      status: "fail",
      selector,
      checkedSelectors: [selector],
      raw: dkimRecord,
      cnameTarget,
      estimatedBits: 0,
      issues,
    };
  }

  // ASN.1 SubjectPublicKeyInfo for 1024-bit RSA is ~162 bytes (~216 b64 chars), 2048-bit is ~294 bytes (~392 b64 chars)
  const keyBytes = Math.floor((publicKey.length * 3) / 4);
  const estimatedBits = keyBytes >= 260 ? 2048 : keyBytes >= 140 ? 1024 : 512;

  if (estimatedBits < 1024) {
    issues.push({
      code: "DKIM_WEAK_KEY",
      severity: "critical",
      summary: `DKIM key on selector "${selector}" is under 1024 bits and rejected by modern receivers.`,
    });
  } else if (estimatedBits < 2048) {
    issues.push({
      code: "DKIM_1024_KEY",
      severity: "warning",
      summary: `DKIM key on selector "${selector}" is 1024-bit. Upgrading to 2048-bit improves trust on Gmail and Microsoft 365.`,
    });
  }

  const hasCritical = issues.some((i) => i.severity === "critical");
  const hasWarn = issues.some((i) => i.severity === "warning");

  return {
    status: hasCritical ? "fail" : hasWarn ? "warn" : "pass",
    selector,
    checkedSelectors: [selector],
    raw: dkimRecord,
    cnameTarget,
    estimatedBits,
    issues,
  };
}

export function analyzeDmarc(txtRecords: string[]): DmarcDiagnostics {
  const issues: DiagnosticIssue[] = [];
  const dmarcRecord = txtRecords.find((r) => /^v=DMARC1\b/i.test(r.trim())) ?? null;

  if (!dmarcRecord) {
    issues.push({
      code: "DMARC_MISSING",
      severity: "critical",
      summary: "No DMARC policy published at _dmarc. Required by Gmail and Yahoo for bulk/cold senders.",
    });
    return {
      status: "fail",
      raw: null,
      policy: null,
      subdomainPolicy: null,
      pct: 100,
      adkim: "r",
      aspf: "r",
      rua: [],
      issues,
    };
  }

  const tags: Record<string, string> = {};
  for (const part of dmarcRecord.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim().toLowerCase();
    const val = part.slice(idx + 1).trim();
    if (key) tags[key] = val;
  }

  const policy = (["none", "quarantine", "reject"].includes((tags.p ?? "").toLowerCase())
    ? tags.p.toLowerCase()
    : null) as DmarcDiagnostics["policy"];

  const subdomainPolicy = (["none", "quarantine", "reject"].includes((tags.sp ?? "").toLowerCase())
    ? tags.sp.toLowerCase()
    : null) as DmarcDiagnostics["subdomainPolicy"];

  const parsedPct = tags.pct !== undefined && tags.pct !== "" ? Number(tags.pct) : 100;
  const pct = Number.isFinite(parsedPct) ? Math.max(0, Math.min(100, parsedPct)) : 100;
  const adkim = tags.adkim?.toLowerCase() === "s" ? "s" : "r";
  const aspf = tags.aspf?.toLowerCase() === "s" ? "s" : "r";
  const rua = tags.rua
    ? tags.rua
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  if (!policy) {
    issues.push({
      code: "DMARC_INVALID_POLICY",
      severity: "critical",
      summary: "DMARC record is missing a valid p= policy (none, quarantine, or reject).",
    });
  } else if (policy === "none") {
    issues.push({
      code: "DMARC_POLICY_NONE",
      severity: "warning",
      summary: "DMARC is in monitor-only mode (p=none). Moving to p=quarantine or p=reject boosts sender reputation.",
    });
  }

  if (rua.length === 0) {
    issues.push({
      code: "DMARC_NO_RUA",
      severity: "warning",
      summary: "DMARC has no rua= reporting address, so you won't receive alignment failure reports.",
    });
  }

  if (pct < 100) {
    issues.push({
      code: "DMARC_PARTIAL_PCT",
      severity: "warning",
      summary: `DMARC only enforces on ${pct}% of mail (pct=${pct}). Set pct=100 for full coverage.`,
    });
  }

  const hasCritical = issues.some((i) => i.severity === "critical");
  const hasWarn = issues.some((i) => i.severity === "warning");
  return {
    status: hasCritical ? "fail" : hasWarn ? "warn" : "pass",
    raw: dmarcRecord,
    policy,
    subdomainPolicy,
    pct,
    adkim,
    aspf,
    rua,
    issues,
  };
}

function inferProviderFromMx(mxRecords: MxRecord[], spfRaw: string | null): string {
  const joinedMx = mxRecords.map((m) => m.exchange).join(" ").toLowerCase();
  const spf = (spfRaw ?? "").toLowerCase();
  if (joinedMx.includes("google") || joinedMx.includes("googlemail") || spf.includes("_spf.google.com")) {
    return "Google Workspace";
  }
  if (joinedMx.includes("outlook.com") || spf.includes("spf.protection.outlook.com")) {
    return "Microsoft 365";
  }
  if (joinedMx.includes("zoho")) return "Zoho Mail";
  if (joinedMx.includes("amazonses")) return "Amazon SES";
  if (joinedMx.includes("fastmail")) return "Fastmail";
  if (joinedMx.includes("protonmail")) return "Proton Mail";
  if (joinedMx.includes("mimecast") || joinedMx.includes("pphosted")) return "Enterprise Relay";
  return mxRecords.length > 0 ? "Custom SMTP" : "Unconfigured";
}

export async function diagnoseDomain(
  input: string,
  options: { selector?: string; resolver?: DnsResolver } = {},
): Promise<DomainDiagnostics> {
  const domain = extractDomain(input);
  const resolver = options.resolver ?? createHybridResolver();

  const [mxRecords, rootTxt, dmarcTxt, bimiTxt, dblAnswers] = await Promise.all([
    resolver.queryMx(domain),
    resolver.queryTxt(domain),
    resolver.queryTxt(`_dmarc.${domain}`),
    resolver.queryTxt(`_default._bimi.${domain}`),
    resolver.queryA(`${domain}.dbl.spamhaus.org`),
  ]);

  const spf = analyzeSpf(rootTxt);
  const dmarc = analyzeDmarc(dmarcTxt);

  const mxIssues: DiagnosticIssue[] = [];
  if (mxRecords.length === 0) {
    mxIssues.push({
      code: "MX_MISSING",
      severity: "critical",
      summary: "No MX records found. Receivers distrust cold emails from domains that cannot accept replies.",
    });
  }

  const candidateSelectors = options.selector?.trim()
    ? [options.selector.trim().toLowerCase()]
    : COMMON_DKIM_SELECTORS;

  const checkedSelectors: string[] = [];
  const probedResults: DkimDiagnostics[] = [];
  for (let i = 0; i < candidateSelectors.length; i += 4) {
    const batch = candidateSelectors.slice(i, i + 4);
    checkedSelectors.push(...batch);
    const batchRes = await Promise.all(
      batch.map(async (sel) => {
        const fqdn = `${sel}._domainkey.${domain}`;
        const [dkimTxt, cnames] = await Promise.all([
          resolver.queryTxt(fqdn),
          resolver.queryCname(fqdn),
        ]);
        return analyzeDkim(sel, dkimTxt, cnames[0] ?? null);
      }),
    );
    probedResults.push(...batchRes);
    if (batchRes.some((r) => Boolean(r.raw))) break;
  }

  const matchedDkim = probedResults.find((res) => Boolean(res.raw));
  let dkim: DkimDiagnostics = matchedDkim
    ? { ...matchedDkim, checkedSelectors }
    : probedResults[0]
      ? { ...probedResults[0], checkedSelectors }
      : analyzeDkim(options.selector?.trim() || "s1", []);

  if (!dkim.raw) {
    dkim = {
      ...dkim,
      selector: options.selector?.trim() || "s1",
      checkedSelectors,
      issues: [
        {
          code: "DKIM_MISSING",
          severity: "critical",
          summary: options.selector?.trim()
            ? `No DKIM key found on selector "${options.selector.trim()}".`
            : `No DKIM key found across common selectors (${checkedSelectors.slice(0, 6).join(", ")}...).`,
        },
      ],
    };
  }

  const bimiRaw = bimiTxt.find((t) => /^v=BIMI1\b/i.test(t.trim())) ?? null;

  // Spamhaus DBL returns 127.0.1.x for actual listings; 127.255.255.x means public DoH query refused (NOT listed).
  const listedOn: string[] = [];
  if (dblAnswers.some((ip) => ip.startsWith("127.0.1."))) {
    listedOn.push("Spamhaus DBL");
  }

  let authScore = 0;
  authScore += mxRecords.length > 0 ? 15 : 0;
  authScore += spf.status === "pass" ? 25 : spf.status === "warn" ? 18 : spf.raw ? 8 : 0;
  authScore += dkim.status === "pass" ? 30 : dkim.status === "warn" ? 22 : 0;
  authScore += dmarc.status === "pass" ? 25 : dmarc.status === "warn" ? 16 : dmarc.raw ? 8 : 0;
  authScore += bimiRaw ? 5 : 0;
  if (listedOn.length > 0) authScore = Math.max(5, authScore - 40);
  authScore = Math.max(0, Math.min(100, authScore));

  return {
    domain,
    detectedProvider: inferProviderFromMx(mxRecords, spf.raw),
    mx: {
      status: mxRecords.length > 0 ? "pass" : "fail",
      records: mxRecords,
      issues: mxIssues,
    },
    spf,
    dkim,
    dmarc,
    bimi: {
      present: Boolean(bimiRaw),
      raw: bimiRaw,
    },
    dnsbl: {
      checked: true,
      listedOn,
    },
    authScore,
    checkedAt: new Date().toISOString(),
  };
}
