import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceStore } from "../src/store/workspace-store.ts";

test("workspace store is 100% Free Forever ($0/mo) with unlimited tests and history logging", async () => {
  const store = createWorkspaceStore();
  const initial = await store.getWorkspace("ws-demo");
  assert.equal(initial.plan.id, "free");
  assert.equal(initial.plan.name, "Free Forever");
  assert.equal(initial.plan.priceUsdMonthly, 0);
  assert.equal(initial.plan.monthlyLimit, null);
  assert.equal(initial.plan.unlimited, true);
  assert.equal(initial.unlimited, true);
  assert.equal(initial.creditsRemaining, null);
  assert.equal(initial.testsRun, 0);

  const first = await store.consumeCreditAndSaveReport("ws-demo", {
    id: "run-1",
    domain: "acme.com",
    subject: "Quick question",
    inboxPct: 92,
    spamScore: 8,
    authScore: 95,
    createdAt: new Date().toISOString(),
    report: { mock: true },
  });

  assert.equal(first.testsRun, 1);
  assert.equal(first.creditsRemaining, null);
  assert.equal(first.unlimited, true);
  const list = await store.listReports("ws-demo");
  assert.equal(list.length, 1);
  assert.equal(list[0].domain, "acme.com");

  // Run 25 more tests (well beyond the old 20-credit monthly limit) — must never throw
  let latest = first;
  for (let i = 0; i < 25; i++) {
    latest = await store.consumeCreditAndSaveReport("ws-demo", {
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

  assert.equal(latest.testsRun, 26);
  assert.equal(latest.creditsRemaining, null);
  assert.equal(latest.unlimited, true);
  assert.equal(latest.plan.priceUsdMonthly, 0);

  const switched = await store.switchPlan("ws-demo", "growth");
  assert.equal(switched.plan.id, "free");
  assert.equal(switched.plan.priceUsdMonthly, 0);
  assert.equal(switched.unlimited, true);
});
