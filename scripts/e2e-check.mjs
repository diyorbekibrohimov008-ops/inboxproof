import http from "node:http";
import assert from "node:assert/strict";
import { createAppHandler } from "../src/server.ts";

const handler = createAppHandler();
const srv = http.createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = chunks.length > 0 && req.method !== "GET" ? Buffer.concat(chunks) : undefined;
  const webReq = new Request(`http://127.0.0.1${req.url || "/"}`, {
    method: req.method,
    headers: req.headers,
    body,
  });
  const webRes = await handler(webReq);
  res.statusCode = webRes.status;
  webRes.headers.forEach((v, k) => res.setHeader(k, v));
  res.end(Buffer.from(await webRes.arrayBuffer()));
});

await new Promise((resolve) => srv.listen(0, "127.0.0.1", resolve));
const { port } = srv.address();
const base = `http://127.0.0.1:${port}`;

try {
  const health = await (await fetch(`${base}/health`)).json();
  assert.equal(health.status, "ok");

  const html = await (await fetch(`${base}/`)).text();
  assert.ok(html.includes("InboxProof"));

  const rewrite = await (
    await fetch(`${base}/api/copy/rewrite`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        subject: "URGENT: 100% FREE guaranteed ROI demo!!!",
        body: "Hi {{first_name}},\n\nAct now for a risk-free limited time offer!",
      }),
    })
  ).json();
  assert.ok(rewrite.afterAnalysis.spamScore < rewrite.beforeAnalysis.spamScore);

  const testRun = await (
    await fetch(`${base}/api/tests/run`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        workspaceId: "e2e-ws",
        fromEmail: "alex@broken-demo.invalid",
        selector: "s1",
        providerPreset: "google-workspace",
        subject: "URGENT: 100% FREE guaranteed ROI!!!",
        body: "Act now to double your revenue risk-free!",
      }),
    })
  ).json();
  assert.equal(testRun.workspace.plan.priceUsdMonthly, 0);
  assert.equal(testRun.workspace.unlimited, true);
  assert.equal(testRun.workspace.creditsRemaining, null);
  assert.equal(testRun.workspace.testsRun, 1);
  assert.ok(testRun.report.remediation.fixes.length >= 3);

  const liveDns = await (
    await fetch(`${base}/api/diagnose/dns`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        domainOrEmail: "alex@resend.com",
        providerPreset: "resend",
      }),
    })
  ).json();
  assert.equal(liveDns.diagnostics.domain, "resend.com");
  assert.ok(liveDns.diagnostics.mx.records.length > 0, "Expected live MX records for resend.com");

  console.log("E2E OK:", {
    healthStatus: health.status,
    liveResendMx: liveDns.diagnostics.mx.records[0]?.exchange,
    liveResendAuthScore: liveDns.diagnostics.authScore,
    rewriteBefore: rewrite.beforeAnalysis.spamScore,
    rewriteAfter: rewrite.afterAnalysis.spamScore,
    testsRun: testRun.workspace.testsRun,
    unlimited: testRun.workspace.unlimited,
    fixesGenerated: testRun.report.remediation.fixes.length,
  });
} finally {
  srv.closeAllConnections?.();
  srv.close();
}
