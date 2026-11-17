import test from "node:test";
import assert from "node:assert/strict";
import {
  extractDomain,
  analyzeSpf,
  analyzeDkim,
  analyzeDmarc,
  diagnoseDomain,
  type DnsResolver,
} from "../src/dns/diagnostics.ts";

function createMockResolver(records: Record<string, string[][]>): DnsResolver {
  return {
    async queryTxt(name: string): Promise<string[]> {
      const key = `TXT:${name.toLowerCase()}`;
      return (records[key] ?? []).map((parts) => parts.join(""));
    },
    async queryMx(name: string): Promise<Array<{ exchange: string; priority: number }>> {
      const key = `MX:${name.toLowerCase()}`;
      return (records[key] ?? []).map(([exchange, priority]) => ({
        exchange,
        priority: Number(priority ?? 10),
      }));
    },
    async queryCname(name: string): Promise<string[]> {
      const key = `CNAME:${name.toLowerCase()}`;
      return (records[key] ?? []).flat();
    },
    async queryA(name: string): Promise<string[]> {
      const key = `A:${name.toLowerCase()}`;
      return (records[key] ?? []).flat();
    },
  };
}

test("extractDomain normalizes email addresses, URLs, and raw domains", () => {
  assert.equal(extractDomain("Alex <Alex@Outreach-Acme.COM>"), "outreach-acme.com");
  assert.equal(extractDomain("https://mail.Acme.io/path"), "mail.acme.io");
  assert.equal(extractDomain("  sending.example.org. "), "sending.example.org");
  assert.throws(() => extractDomain("not a domain"), /Invalid domain/i);
});

test("analyzeSpf passes healthy record and counts includes accurately", () => {
  const res = analyzeSpf(["v=spf1 include:_spf.google.com include:sendgrid.net ~all"]);
  assert.equal(res.status, "pass");
  assert.equal(res.lookupCount, 2);
  assert.equal(res.qualifier, "~all");
  assert.deepEqual(res.issues, []);
});

test("analyzeSpf flags >10 DNS lookups (RFC 7208 permerror)", () => {
  const includes = Array.from({ length: 11 }, (_, i) => `include:s${i}.example.com`).join(" ");
  const res = analyzeSpf([`v=spf1 ${includes} -all`]);
  assert.equal(res.status, "fail");
  assert.equal(res.lookupCount, 11);
  assert.ok(res.issues.some((i) => i.code === "SPF_TOO_MANY_LOOKUPS"));
});

test("analyzeSpf flags multiple SPF records and permissive +all", () => {
  const multi = analyzeSpf(["v=spf1 include:_spf.google.com ~all", "v=spf1 include:spf.protection.outlook.com ~all"]);
  assert.equal(multi.status, "fail");
  assert.ok(multi.issues.some((i) => i.code === "SPF_MULTIPLE_RECORDS"));

  const permissive = analyzeSpf(["v=spf1 include:_spf.google.com +all"]);
  assert.equal(permissive.status, "fail");
  assert.ok(permissive.issues.some((i) => i.code === "SPF_PERMISSIVE_ALL"));
});

test("analyzeDkim validates 2048-bit key vs revoked or missing key", () => {
  const longKey = "A".repeat(380);
  const pass = analyzeDkim("s1", [`v=DKIM1; k=rsa; p=${longKey}`]);
  assert.equal(pass.status, "pass");
  assert.ok(pass.estimatedBits >= 2048);

  const revoked = analyzeDkim("s1", ["v=DKIM1; k=rsa; p="]);
  assert.equal(revoked.status, "fail");
  assert.ok(revoked.issues.some((i) => i.code === "DKIM_REVOKED"));

  const missing = analyzeDkim("s1", []);
  assert.equal(missing.status, "fail");
  assert.ok(missing.issues.some((i) => i.code === "DKIM_MISSING"));
});

test("analyzeDmarc warns on p=none and passes p=quarantine/reject with rua", () => {
  const none = analyzeDmarc(["v=DMARC1; p=none; rua=mailto:dmarc@acme.com"]);
  assert.equal(none.status, "warn");
  assert.ok(none.issues.some((i) => i.code === "DMARC_POLICY_NONE"));

  const strict = analyzeDmarc(["v=DMARC1; p=reject; adkim=s; aspf=r; rua=mailto:dmarc@acme.com"]);
  assert.equal(strict.status, "pass");
  assert.equal(strict.policy, "reject");
});

test("diagnoseDomain aggregates MX, SPF, auto-probed DKIM, DMARC, and BIMI", async () => {
  const longKey = "B".repeat(380);
  const resolver = createMockResolver({
    "MX:acme.com": [["aspmx.l.google.com", "1"]],
    "TXT:acme.com": [["v=spf1 include:_spf.google.com ~all"]],
    "TXT:google._domainkey.acme.com": [[`v=DKIM1; k=rsa; p=${longKey}`]],
    "TXT:_dmarc.acme.com": [["v=DMARC1; p=quarantine; rua=mailto:dmarc@acme.com"]],
    "TXT:_default._bimi.acme.com": [["v=BIMI1; l=https://acme.com/logo.svg"]],
  });

  const report = await diagnoseDomain("alex@acme.com", { resolver });
  assert.equal(report.domain, "acme.com");
  assert.equal(report.detectedProvider, "Google Workspace");
  assert.equal(report.spf.status, "pass");
  assert.equal(report.dkim.status, "pass");
  assert.equal(report.dkim.selector, "google");
  assert.equal(report.dmarc.status, "pass");
  assert.equal(report.bimi.present, true);
  assert.ok(report.authScore >= 90);
});
