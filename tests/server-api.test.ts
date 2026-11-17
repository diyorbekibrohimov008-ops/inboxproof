import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { createAppHandler } from "../src/server.ts";
import type { DnsResolver } from "../src/dns/diagnostics.ts";

function createTestResolver(): DnsResolver {
  const longKey = "C".repeat(380);
  return {
    async queryMx(name: string) {
      if (name === "good-cold.io") return [{ exchange: "smtp.google.com", priority: 1 }];
      return [];
    },
    async queryTxt(name: string) {
      if (name === "good-cold.io") return ["v=spf1 include:_spf.google.com ~all"];
      if (name === "google._domainkey.good-cold.io") return [`v=DKIM1; k=rsa; p=${longKey}`];
      if (name === "_dmarc.good-cold.io") return ["v=DMARC1; p=quarantine; rua=mailto:dmarc@good-cold.io"];
      return [];
    },
    async queryCname() {
      return [];
    },
    async queryA() {
      return [];
    },
  };
}

test("GET /health and GET / render healthy HTML & JSON", async () => {
  const handler = createAppHandler({ resolver: createTestResolver() });

  const healthRes = await handler(new Request("http://localhost/health"));
  assert.equal(healthRes.status, 200);
  const health = (await healthRes.json()) as { status: string; service: string };
  assert.equal(health.status, "ok");
  assert.equal(health.service, "inboxproof");

  const htmlRes = await handler(new Request("http://localhost/"));
  assert.equal(htmlRes.status, 200);
  assert.match(htmlRes.headers.get("content-type") ?? "", /text\/html/);
  const html = await htmlRes.text();
  assert.match(html, /InboxProof/);
  assert.match(html, /\$19\/mo/);
});

test("POST /api/tests/run executes full diagnostic, deducts 1 credit, and persists report", async () => {
  const handler = createAppHandler({ resolver: createTestResolver() });

  const runRes = await handler(
    new Request("http://localhost/api/tests/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId: "ws-api-test",
        fromEmail: "alex@good-cold.io",
        providerPreset: "google-workspace",
        subject: "Quick question on Q4 outbound",
        body: "Hi Jordan,\n\nSaw you're expanding outbound. Worth a 5-min chat?\n\nBest,\nAlex",
      }),
    }),
  );

  assert.equal(runRes.status, 200);
  const payload = (await runRes.json()) as {
    workspace: { creditsRemaining: number; plan: { priceUsdMonthly: number } };
    report: { domain: string; summary: { inboxPct: number }; diagnostics: { authScore: number } };
  };

  assert.equal(payload.workspace.plan.priceUsdMonthly, 19);
  assert.equal(payload.workspace.creditsRemaining, 19);
  assert.equal(payload.report.domain, "good-cold.io");
  assert.ok(payload.report.summary.inboxPct >= 85);
  assert.ok(payload.report.diagnostics.authScore >= 90);

  const wsRes = await handler(new Request("http://localhost/api/workspace?workspaceId=ws-api-test"));
  assert.equal(wsRes.status, 200);
  const wsData = (await wsRes.json()) as {
    workspace: { creditsRemaining: number };
    reports: Array<{ domain: string }>;
  };
  assert.equal(wsData.workspace.creditsRemaining, 19);
  assert.equal(wsData.reports.length, 1);
  assert.equal(wsData.reports[0].domain, "good-cold.io");
});

test("POST /api/copy/rewrite rewrites spammy cold email without deducting credits", async () => {
  const handler = createAppHandler({ resolver: createTestResolver() });

  const res = await handler(
    new Request("http://localhost/api/copy/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: "URGENT: 100% FREE guaranteed ROI!!!",
        body: "Hi {{first_name}},\n\nAct now for a risk-free limited time offer.\n\nBest,\nAlex",
      }),
    }),
  );

  assert.equal(res.status, 200);
  const data = (await res.json()) as {
    beforeAnalysis: { spamScore: number };
    afterAnalysis: { spamScore: number };
    rewrittenSubject: string;
    rewrittenBody: string;
  };
  assert.ok(data.afterAnalysis.spamScore < data.beforeAnalysis.spamScore);
  assert.ok(data.rewrittenBody.includes("{{first_name}}"));
});

test("POST /api/diagnose/dns returns live DNS + registrar remediation without charging credits", async () => {
  const handler = createAppHandler({ resolver: createTestResolver() });

  const res = await handler(
    new Request("http://localhost/api/diagnose/dns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        domainOrEmail: "alex@broken-domain.example",
        selector: "s1",
        providerPreset: "google-workspace",
      }),
    }),
  );

  assert.equal(res.status, 200);
  const data = (await res.json()) as {
    diagnostics: { domain: string; authScore: number };
    remediation: { fixes: Array<{ category: string; recordsByRegistrar: { godaddy: { host: string } } }> };
  };
  assert.equal(data.diagnostics.domain, "broken-domain.example");
  assert.ok(data.diagnostics.authScore < 30);
  assert.ok(data.remediation.fixes.some((f) => f.category === "DMARC"));
});

test("inline client script in GET / compiles with zero JS syntax errors", async () => {
  const handler = createAppHandler({ resolver: createTestResolver() });
  const html = await (await handler(new Request("http://localhost/"))).text();
  const match = html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(match && match[1], "Expected inline <script> tag in HTML");
  assert.doesNotThrow(() => new vm.Script(match[1]));
});
