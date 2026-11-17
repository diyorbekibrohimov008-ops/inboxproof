import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceStore } from "../src/store/workspace-store.ts";

test("workspace store enforces Solopreneur $19/mo 20-credit monthly quota and logs history", async () => {
  const store = createWorkspaceStore();
  const initial = await store.getWorkspace("ws-demo");
  assert.equal(initial.plan.name, "Solopreneur");
  assert.equal(initial.plan.priceUsdMonthly, 19);
  assert.equal(initial.plan.monthlyLimit, 20);
  assert.equal(initial.creditsRemaining, 20);

  const consumed = await store.consumeCreditAndSaveReport("ws-demo", {
    id: "run-1",
    domain: "acme.com",
    subject: "Quick question",
    inboxPct: 92,
    spamScore: 8,
    authScore: 95,
    createdAt: new Date().toISOString(),
    report: { mock: true },
  });

  assert.equal(consumed.creditsRemaining, 19);
  const list = await store.listReports("ws-demo");
  assert.equal(list.length, 1);
  assert.equal(list[0].domain, "acme.com");

  for (let i = 0; i < 19; i++) {
    await store.consumeCreditAndSaveReport("ws-demo", {
      id: `run-${i + 2}`,
      domain: "acme.com",
      subject: "Follow up",
      inboxPct: 90,
      spamScore: 10,
      authScore: 95,
      createdAt: new Date().toISOString(),
      report: { mock: true },
    });
  }

  await assert.rejects(
    () =>
      store.consumeCreditAndSaveReport("ws-demo", {
        id: "run-overflow",
        domain: "acme.com",
        subject: "Blocked",
        inboxPct: 90,
        spamScore: 10,
        authScore: 95,
        createdAt: new Date().toISOString(),
        report: { mock: true },
      }),
    /Monthly placement test limit reached/i,
  );
});
