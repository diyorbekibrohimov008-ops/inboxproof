import test from "node:test";
import assert from "node:assert/strict";
import { parseEmailHeaders, runPlacementTest } from "../src/placement/seed-engine.ts";
import type { DomainDiagnostics } from "../src/dns/diagnostics.ts";

const healthyDns: DomainDiagnostics = {
  domain: "clean-sender.io",
  detectedProvider: "Google Workspace",
  mx: { status: "pass", records: [{ exchange: "smtp.google.com", priority: 1 }], issues: [] },
  spf: {
    status: "pass",
    raw: "v=spf1 include:_spf.google.com ~all",
    records: ["v=spf1 include:_spf.google.com ~all"],
    lookupCount: 1,
    includes: ["_spf.google.com"],
    qualifier: "~all",
    issues: [],
  },
  dkim: {
    status: "pass",
    selector: "google",
    checkedSelectors: ["google"],
    raw: "v=DKIM1; k=rsa; p=" + "A".repeat(380),
    cnameTarget: null,
    estimatedBits: 2048,
    issues: [],
  },
  dmarc: {
    status: "pass",
    raw: "v=DMARC1; p=quarantine; rua=mailto:dmarc@clean-sender.io",
    policy: "quarantine",
    subdomainPolicy: null,
    pct: 100,
    adkim: "r",
    aspf: "r",
    rua: ["mailto:dmarc@clean-sender.io"],
    issues: [],
  },
  bimi: { present: true, raw: "v=BIMI1; l=https://clean-sender.io/logo.svg" },
  dnsbl: { checked: true, listedOn: [] },
  authScore: 98,
  checkedAt: new Date().toISOString(),
};

const brokenDns: DomainDiagnostics = {
  ...healthyDns,
  domain: "broken-sender.io",
  spf: {
    status: "fail",
    raw: null,
    records: [],
    lookupCount: 0,
    includes: [],
    qualifier: null,
    issues: [{ code: "SPF_MISSING", severity: "critical", summary: "Missing SPF" }],
  },
  dkim: {
    status: "fail",
    selector: "s1",
    checkedSelectors: ["s1"],
    raw: null,
    cnameTarget: null,
    estimatedBits: 0,
    issues: [{ code: "DKIM_MISSING", severity: "critical", summary: "Missing DKIM" }],
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
    issues: [{ code: "DMARC_MISSING", severity: "critical", summary: "Missing DMARC" }],
  },
  bimi: { present: false, raw: null },
  authScore: 10,
};

test("parseEmailHeaders extracts SPF, DKIM, DMARC, and detects domain misalignment", () => {
  const raw = [
    "From: Alex <alex@acme.io>",
    "Return-Path: <bounce@mailer-relay.net>",
    "DKIM-Signature: v=1; a=rsa-sha256; d=sendgrid.net; s=s1; bh=abc;",
    "Authentication-Results: mx.google.com; dkim=pass header.i=@sendgrid.net header.s=s1; spf=pass (google.com: domain of bounce@mailer-relay.net designates 1.2.3.4) smtp.mailfrom=mailer-relay.net; dmarc=fail (p=NONE) header.from=acme.io",
    "Subject: Hello",
    "",
    "Body text",
  ].join("\r\n");

  const parsed = parseEmailHeaders(raw);
  assert.equal(parsed.fromDomain, "acme.io");
  assert.equal(parsed.returnPathDomain, "mailer-relay.net");
  assert.equal(parsed.dkimDomain, "sendgrid.net");
  assert.equal(parsed.dkimSelector, "s1");
  assert.equal(parsed.spfResult, "pass");
  assert.equal(parsed.dkimResult, "pass");
  assert.equal(parsed.dmarcResult, "fail");
  assert.equal(parsed.dkimAligned, false);
  assert.equal(parsed.spfAligned, false);
});

test("runPlacementTest scores healthy domain + clean copy much higher than broken domain + spammy copy", () => {
  const good = runPlacementTest({
    diagnostics: healthyDns,
    subject: "Quick question about outbound deliverability",
    body: "Hi Jordan,\n\nSaw you're scaling outbound this quarter. Open to a quick benchmark chat?\n\nBest,\nAlex",
    providerPreset: "google-workspace",
  });

  const bad = runPlacementTest({
    diagnostics: brokenDns,
    subject: "URGENT 100% FREE GUARANTEED ROI!!!",
    body: "Act now! Limited time offer to double your revenue risk-free: https://bit.ly/spam",
    providerPreset: "custom-smtp",
  });

  assert.equal(good.seeds.length, 18);
  assert.equal(good.summary.inboxPct + good.summary.promotionsPct + good.summary.spamPct, 100);
  assert.equal(bad.summary.inboxPct + bad.summary.promotionsPct + bad.summary.spamPct, 100);
  assert.ok(good.summary.inboxPct >= 85, `Expected healthy inboxPct >= 85, got ${good.summary.inboxPct}`);
  assert.ok(bad.summary.spamPct >= 55, `Expected broken spamPct >= 55, got ${bad.summary.spamPct}`);
  assert.ok(good.summary.inboxPct > bad.summary.inboxPct + 45);
});
