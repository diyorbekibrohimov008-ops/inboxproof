import test from "node:test";
import assert from "node:assert/strict";
import { analyzeSpamCopy, rewriteSpamCopy } from "../src/copy/spam-analyzer.ts";

test("analyzeSpamCopy highlights spam triggers with exact offsets and high spam score", () => {
  const subject = "URGENT: 100% FREE guaranteed ROI demo!!!";
  const body =
    "Hi {{first_name}},\n\nAct now for a risk-free limited time offer to double your revenue. Click here: https://bit.ly/demo\n\nBest,\nAlex";

  const analysis = analyzeSpamCopy(subject, body);
  assert.ok(analysis.spamScore >= 60, `Expected high spamScore, got ${analysis.spamScore}`);
  assert.ok(analysis.subjectTriggers.length >= 3);
  assert.ok(analysis.bodyTriggers.length >= 3);

  for (const t of analysis.subjectTriggers) {
    assert.equal(subject.slice(t.start, t.end), t.text);
  }
  for (const t of analysis.bodyTriggers) {
    assert.equal(body.slice(t.start, t.end), t.text);
  }
});

test("analyzeSpamCopy scores clean conversational cold email low", () => {
  const subject = "Quick question about Q4 outbound at {{company}}";
  const body =
    "Hi {{first_name}},\n\nNoticed your team is hiring two new SDRs this quarter. How are you validating domain health before ramping daily send volume?\n\nHappy to share a short 2-minute breakdown if helpful.\n\nBest,\nAlex";

  const analysis = analyzeSpamCopy(subject, body);
  assert.ok(analysis.spamScore <= 15, `Expected low spamScore <= 15, got ${analysis.spamScore}`);
  assert.equal(analysis.riskLevel, "low");
});

test("rewriteSpamCopy cleanly rewrites risky sentences, preserves tokens, and drops spam score", () => {
  const subject = "URGENT: 100% FREE guaranteed ROI demo!!!";
  const body =
    "Hi {{first_name}},\n\nAct now for a risk-free limited time offer to double your revenue.\n\nClick here to claim your free trial today: https://bit.ly/3xDemo\n\nBest,\nAlex";

  const result = rewriteSpamCopy(subject, body);
  assert.ok(result.afterAnalysis.spamScore < result.beforeAnalysis.spamScore);
  assert.ok(result.afterAnalysis.spamScore <= 25, `Expected clean score <= 25, got ${result.afterAnalysis.spamScore}`);
  assert.ok(result.rewrittenBody.includes("{{first_name}}"), "Must preserve personalization tokens");
  assert.ok(result.sentenceDiffs.length >= 2);
  assert.ok(!/URGENT|100% FREE|guaranteed ROI|!!!/i.test(result.rewrittenSubject));
});
