import test from "node:test";
import assert from "node:assert/strict";
import { buildRemediationPlan } from "../src/dns/remediation.ts";
import type { DomainDiagnostics } from "../src/dns/diagnostics.ts";

function makeBrokenDiagnostics(domain = "outreach.acme.com"): DomainDiagnostics {
  return {
    domain,
    detectedProvider: "Google Workspace",
    mx: { status: "pass", records: [{ exchange: "smtp.google.com", priority: 1 }], issues: [] },
    spf: {
      status: "fail",
      raw: null,
      records: [],
      lookupCount: 0,
      includes: [],
      qualifier: null,
      issues: [{ code: "SPF_MISSING", severity: "critical", summary: "No SPF record found." }],
    },
    dkim: {
      status: "fail",
      selector: "s1",
      checkedSelectors: ["s1"],
      raw: null,
      cnameTarget: null,
      estimatedBits: 0,
      issues: [{ code: "DKIM_MISSING", severity: "critical", summary: "No DKIM key found on selector s1." }],
    },
    dmarc: {
      status: "fail",
      raw: null,
      policy: null,
      subdomainPolicy: null,
      pct: 100,
      adkim: "r",
      aspf: "r",
      rua: [],
      issues: [{ code: "DMARC_MISSING", severity: "critical", summary: "No DMARC record found." }],
    },
    bimi: { present: false, raw: null },
    dnsbl: { checked: true, listedOn: [] },
    authScore: 15,
    checkedAt: new Date().toISOString(),
  };
}

test("buildRemediationPlan outputs registrar-specific host names without cryptic RFC jargon", () => {
  const plan = buildRemediationPlan(makeBrokenDiagnostics("outreach.acme.com"), {
    providerPreset: "google-workspace",
    fromEmail: "alex@outreach.acme.com",
  });

  assert.equal(plan.fixes.length, 3);

  const dmarcFix = plan.fixes.find((f) => f.category === "DMARC");
  assert.ok(dmarcFix);
  assert.ok(!dmarcFix.plainEnglishWhy.includes("RFC 7489"));
  assert.equal(dmarcFix.recordsByRegistrar.cloudflare.host, "_dmarc.outreach.acme.com");
  assert.equal(dmarcFix.recordsByRegistrar.godaddy.host, "_dmarc.outreach");
  assert.equal(dmarcFix.recordsByRegistrar.namecheap.host, "_dmarc.outreach");
  assert.match(dmarcFix.recordsByRegistrar.cloudflare.value, /v=DMARC1;\s*p=quarantine/i);

  const spfFix = plan.fixes.find((f) => f.category === "SPF");
  assert.ok(spfFix);
  assert.equal(spfFix.recordsByRegistrar.godaddy.host, "outreach");
  assert.match(spfFix.recordsByRegistrar.godaddy.value, /include:_spf\.google\.com/);

  const dkimFix = plan.fixes.find((f) => f.category === "DKIM");
  assert.ok(dkimFix);
  assert.equal(dkimFix.recordsByRegistrar.cloudflare.type, "TXT");
  assert.equal(dkimFix.recordsByRegistrar.cloudflare.host, "google._domainkey.outreach.acme.com");
  assert.equal(dkimFix.recordsByRegistrar.godaddy.host, "google._domainkey.outreach");
});

test("buildRemediationPlan uses @ host for apex root domain and enforces Cloudflare DNS Only on M365 CNAMEs", () => {
  const plan = buildRemediationPlan(makeBrokenDiagnostics("acme.com"), {
    providerPreset: "microsoft-365",
    fromEmail: "founder@acme.com",
  });

  const spfFix = plan.fixes.find((f) => f.category === "SPF");
  assert.ok(spfFix);
  assert.equal(spfFix.recordsByRegistrar.godaddy.host, "@");
  assert.equal(spfFix.recordsByRegistrar.cloudflare.host, "acme.com");
  assert.match(spfFix.recordsByRegistrar.cloudflare.value, /include:spf\.protection\.outlook\.com/);

  const dkimFix = plan.fixes.find((f) => f.category === "DKIM");
  assert.ok(dkimFix);
  assert.equal(dkimFix.recordsByRegistrar.cloudflare.type, "CNAME");
  assert.equal(dkimFix.recordsByRegistrar.cloudflare.proxyStatus, "DNS Only (Grey Cloud)");
});
