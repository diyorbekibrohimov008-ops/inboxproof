export type TriggerSeverity = "critical" | "high" | "medium";
export type TriggerCategory =
  | "urgency"
  | "hype"
  | "financial"
  | "phishing"
  | "formatting"
  | "links"
  | "compliance";

export interface CopyTrigger {
  text: string;
  start: number;
  end: number;
  category: TriggerCategory;
  severity: TriggerSeverity;
  points: number;
  reason: string;
  suggestions: string[];
}

export interface CopyAnalysis {
  spamScore: number;
  riskLevel: "low" | "moderate" | "high";
  wordCount: number;
  linkCount: number;
  subjectTriggers: CopyTrigger[];
  bodyTriggers: CopyTrigger[];
}

export interface SentenceDiff {
  before: string;
  after: string;
  reason: string;
}

export interface RewriteResult {
  beforeAnalysis: CopyAnalysis;
  afterAnalysis: CopyAnalysis;
  rewrittenSubject: string;
  rewrittenBody: string;
  sentenceDiffs: SentenceDiff[];
  projectedInboxLiftPct: number;
  usedLlm: boolean;
}

interface SpamRule {
  pattern: RegExp;
  category: TriggerCategory;
  severity: TriggerSeverity;
  points: number;
  reason: string;
  suggestions: string[];
  replacement: string;
}

const SPAM_RULES: SpamRule[] = [
  {
    pattern: /\b100%\s*free\b/gi,
    category: "financial",
    severity: "critical",
    points: 20,
    reason: "'100% free' is one of the highest-weighted promotional spam filter triggers.",
    suggestions: ["complimentary", "no-cost benchmark", "open to sharing"],
    replacement: "complimentary",
  },
  {
    pattern: /\bguaranteed\s+roi\b/gi,
    category: "hype",
    severity: "critical",
    points: 22,
    reason: "Unverifiable ROI guarantees trigger both Gmail Promotions and Microsoft Defender spam filters.",
    suggestions: ["measurable pipeline lift", "consistent results", "tested benchmarks"],
    replacement: "measurable pipeline lift",
  },
  {
    pattern: /\bguarantee(?:d)?\b/gi,
    category: "hype",
    severity: "high",
    points: 14,
    reason: "Absolute guarantee claims look like mass-marketing blasts to spam classifiers.",
    suggestions: ["built to support", "designed for", "proven with similar teams"],
    replacement: "proven",
  },
  {
    pattern: /\brisk[- ]free\b/gi,
    category: "financial",
    severity: "critical",
    points: 18,
    reason: "'Risk-free' strongly correlates with promotional and phishing templates.",
    suggestions: ["lightweight", "quick", "no-obligation"],
    replacement: "lightweight",
  },
  {
    pattern: /\bact\s+now\b/gi,
    category: "urgency",
    severity: "critical",
    points: 18,
    reason: "Artificial urgency ('Act now') signals automated blast campaigns rather than 1:1 outreach.",
    suggestions: ["happy to send over", "worth a look this week", "open to exploring"],
    replacement: "worth a quick look",
  },
  {
    pattern: /\blimited[- ]time\s+offer\b/gi,
    category: "urgency",
    severity: "critical",
    points: 20,
    reason: "'Limited-time offer' is flagged as commercial promo copy by Gmail's tab classifier.",
    suggestions: ["quick breakdown", "short walkthrough", "relevant benchmark"],
    replacement: "short walkthrough",
  },
  {
    pattern: /\burgent\b/gi,
    category: "urgency",
    severity: "critical",
    points: 18,
    reason: "'Urgent' in cold email subjects mimics BEC/phishing alerts and triggers quarantine.",
    suggestions: ["Quick question", "Relevant idea", "Following up"],
    replacement: "Quick question",
  },
  {
    pattern: /\bdouble\s+your\s+(?:revenue|sales|leads|income)\b/gi,
    category: "hype",
    severity: "critical",
    points: 20,
    reason: "Exaggerated revenue-doubling promises immediately lower sender trust.",
    suggestions: ["improve reply rates", "increase qualified pipeline", "lift conversion"],
    replacement: "lift qualified reply rates",
  },
  {
    pattern: /\bclick\s+here\b/gi,
    category: "phishing",
    severity: "high",
    points: 15,
    reason: "'Click here' is flagged by corporate phishing filters (Proofpoint, Mimecast, Defender).",
    suggestions: ["Happy to share the details", "I can reply with the link", "Open to seeing it"],
    replacement: "Happy to send the breakdown",
  },
  {
    pattern: /\bfree\s+trial\b/gi,
    category: "financial",
    severity: "medium",
    points: 10,
    reason: "Promotional CTA phrases push emails from Primary Inbox into Promotions.",
    suggestions: ["sandbox test", "quick walkthrough", "sample audit"],
    replacement: "sample audit",
  },
  {
    pattern: /\bfree\b/gi,
    category: "financial",
    severity: "medium",
    points: 8,
    reason: "The word 'free' in cold outreach increases promotional tab placement risk.",
    suggestions: ["complimentary", "no-cost", "sample"],
    replacement: "sample",
  },
  {
    pattern: /\bwire\s+transfer\b|\bcrypto\s+payout\b|\bno\s+credit\s+check\b/gi,
    category: "phishing",
    severity: "critical",
    points: 25,
    reason: "High-risk financial phrases trigger automatic spam/phishing rejection.",
    suggestions: ["standard invoice", "flexible billing"],
    replacement: "standard invoice",
  },
  {
    pattern: /https?:\/\/(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|rb\.gy)\/\S+/gi,
    category: "links",
    severity: "critical",
    points: 22,
    reason: "Public URL shorteners mask destination domains and are blocked by enterprise spam gateways.",
    suggestions: ["Remove shortened link in first email", "Use your own clean domain link"],
    replacement: "(happy to reply with our notes)",
  },
  {
    pattern: /!{2,}|\${2,}/g,
    category: "formatting",
    severity: "high",
    points: 14,
    reason: "Repeated exclamation marks or dollar symbols trigger spam heuristics.",
    suggestions: ["Use a single period or question mark"],
    replacement: ".",
  },
  {
    pattern: /\b[A-Z]{4,}\b/g,
    category: "formatting",
    severity: "medium",
    points: 10,
    reason: "ALL-CAPS shouting looks automated and hurts deliverability.",
    suggestions: ["Use normal sentence case"],
    replacement: "",
  },
  {
    pattern: /\bbuy\s+now\b|\border\s+today\b|\bspecial\s+promotion\b/gi,
    category: "hype",
    severity: "high",
    points: 15,
    reason: "E-commerce CTA phrasing moves B2B emails out of the Primary Inbox.",
    suggestions: ["worth exploring", "open to a quick chat"],
    replacement: "worth exploring",
  },
];

const SAFE_ALL_CAPS_WHITELIST = new Set([
  "ROI",
  "SDR",
  "B2B",
  "SaaS",
  "CRM",
  "DNS",
  "SPF",
  "DKIM",
  "DMARC",
  "API",
  "SMTP",
  "IMAP",
  "HTTP",
  "HTTPS",
  "CEO",
  "CTO",
  "VP",
  "KPI",
  "OKR",
  "USA",
  "EU",
  "UK",
]);

function scanTextTriggers(text: string): CopyTrigger[] {
  const candidates: CopyTrigger[] = [];

  for (const rule of SPAM_RULES) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const matched = match[0];
      const start = match.index;
      const end = start + matched.length;

      if (rule.category === "formatting" && /^[A-Z]+$/.test(matched)) {
        if (SAFE_ALL_CAPS_WHITELIST.has(matched)) continue;
        // Skip uppercase inside {{TOKEN}}
        if (text.slice(Math.max(0, start - 2), start) === "{{") continue;
      }

      candidates.push({
        text: matched,
        start,
        end,
        category: rule.category,
        severity: rule.severity,
        points: rule.points,
        reason: rule.reason,
        suggestions: rule.suggestions,
      });

      if (matched.length === 0) break;
    }
  }

  // Sort by start offset, preferring longer/more specific spans if two overlap
  candidates.sort((a, b) => a.start - b.start || b.end - a.end);

  const nonOverlapping: CopyTrigger[] = [];
  let cursor = -1;
  for (const item of candidates) {
    if (item.start >= cursor) {
      nonOverlapping.push(item);
      cursor = item.end;
    }
  }
  return nonOverlapping;
}

export function analyzeSpamCopy(subject: string, body: string): CopyAnalysis {
  const subjectTriggers = scanTextTriggers(subject);
  const bodyTriggers = scanTextTriggers(body);
  const links = body.match(/https?:\/\/\S+/gi) ?? [];
  const words = body.trim().split(/\s+/).filter(Boolean);

  let rawScore = 0;
  for (const t of subjectTriggers) rawScore += Math.round(t.points * 1.25);
  for (const t of bodyTriggers) rawScore += t.points;

  if (links.length >= 3) rawScore += 15;
  else if (links.length === 2) rawScore += 7;

  if (words.length > 260) rawScore += 8;

  const spamScore = Math.max(0, Math.min(100, rawScore));
  const riskLevel: CopyAnalysis["riskLevel"] =
    spamScore >= 50 ? "high" : spamScore >= 20 ? "moderate" : "low";

  return {
    spamScore,
    riskLevel,
    wordCount: words.length,
    linkCount: links.length,
    subjectTriggers,
    bodyTriggers,
  };
}

function rewriteSegmentDeterministically(text: string): string {
  let out = text;

  // Preserve {{tokens}} during rewriting
  const tokens: string[] = [];
  out = out.replace(/\{\{[^}]+\}\}/g, (m) => {
    const idx = tokens.length;
    tokens.push(m);
    return `__TOKEN_${idx}__`;
  });

  // High-impact phrase replacements for natural conversational cold email tone
  const phrasePairs: Array<[RegExp, string]> = [
    [/^URGENT\s*[:\-–]?\s*/i, "Quick question: "],
    [/\bURGENT\b/gi, "Quick note"],
    [/\b100%\s*free\b/gi, "complimentary"],
    [/\bguaranteed\s+roi\b/gi, "benchmark-backed"],
    [/\bguarantee(?:d)?\b/gi, "consistent"],
    [/\bact\s+now\s+for\s+(?:a\s+)?/gi, "happy to share a "],
    [/\bact\s+now\b/gi, "open to a look"],
    [/\brisk[- ]free\s+limited[- ]time\s+offer\b/gi, "short walkthrough"],
    [/\blimited[- ]time\s+offer\b/gi, "short walkthrough"],
    [/\brisk[- ]free\b/gi, "no-obligation"],
    [/\bto\s+double\s+your\s+(?:revenue|sales|leads|income)\b/gi, "to lift qualified reply rates"],
    [/\bdouble\s+your\s+(?:revenue|sales|leads|income)\b/gi, "improve qualified reply rates"],
    [/\bclick\s+here\s+to\s+claim\s+your\s+free\s+trial\s+today\b/gi, "happy to reply with a sample audit"],
    [/\bclick\s+here\b/gi, "happy to share details"],
    [/\bfree\s+trial\b/gi, "sample audit"],
    [/\bfree\b/gi, "complimentary"],
    [/\bbuy\s+now\b|\border\s+today\b/gi, "worth exploring"],
    [/:\s*https?:\/\/(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|rb\.gy)\/\S+/gi, " — happy to send the link if useful."],
    [/https?:\/\/(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|rb\.gy)\/\S+/gi, "(happy to send the details on reply)"],
    [/!{2,}|\${2,}/g, "."],
    [/!$/g, "."],
  ];

  for (const [regex, replacement] of phrasePairs) {
    out = out.replace(regex, replacement);
  }

  // Convert shouting ALL CAPS words (4+ letters) not in whitelist to sentence/lower case
  out = out.replace(/\b[A-Z]{4,}\b/g, (word, offset) => {
    if (SAFE_ALL_CAPS_WHITELIST.has(word) || word.startsWith("__TOKEN_")) return word;
    const isStart = offset === 0 || /[.!?\n]\s*$/.test(out.slice(0, offset));
    const lower = word.toLowerCase();
    return isStart ? lower[0].toUpperCase() + lower.slice(1) : lower;
  });

  // Tidy punctuation artifacts
  out = out
    .replace(/\s+([.,!?])/g, "$1")
    .replace(/\.{2,}/g, ".")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Restore tokens
  out = out.replace(/__TOKEN_(\d+)__/g, (_, idx) => tokens[Number(idx)] ?? "");
  return out;
}

export function rewriteSpamCopy(subject: string, body: string): RewriteResult {
  const beforeAnalysis = analyzeSpamCopy(subject, body);
  const rewrittenSubject = rewriteSegmentDeterministically(subject);

  const lines = body.split(/\r?\n/);
  const sentenceDiffs: SentenceDiff[] = [];

  if (rewrittenSubject !== subject.trim()) {
    sentenceDiffs.push({
      before: subject,
      after: rewrittenSubject,
      reason: "Removed subject-line hype and urgency triggers that trip Gmail/Outlook filters.",
    });
  }

  const rewrittenLines = lines.map((line) => {
    if (!line.trim()) return line;
    const lineAnalysis = scanTextTriggers(line);
    if (lineAnalysis.length === 0) return line;
    const cleaned = rewriteSegmentDeterministically(line);
    if (cleaned !== line.trim()) {
      sentenceDiffs.push({
        before: line.trim(),
        after: cleaned,
        reason: lineAnalysis.map((t) => t.reason)[0] ?? "Softened promotional phrasing for 1:1 cold outreach.",
      });
    }
    return cleaned;
  });

  const rewrittenBody = rewrittenLines.join("\n");
  const afterAnalysis = analyzeSpamCopy(rewrittenSubject, rewrittenBody);
  const scoreDrop = Math.max(0, beforeAnalysis.spamScore - afterAnalysis.spamScore);
  const projectedInboxLiftPct = Math.min(42, Math.round(scoreDrop * 0.48));

  return {
    beforeAnalysis,
    afterAnalysis,
    rewrittenSubject,
    rewrittenBody,
    sentenceDiffs,
    projectedInboxLiftPct,
    usedLlm: false,
  };
}

export async function rewriteSpamCopyWithOptionalLlm(
  subject: string,
  body: string,
): Promise<RewriteResult> {
  const deterministic = rewriteSpamCopy(subject, body);
  const openAiKey =
    (globalThis as { Bun?: { env?: Record<string, string | undefined> } }).Bun?.env?.OPENAI_API_KEY ??
    process.env?.OPENAI_API_KEY;

  if (!openAiKey) {
    return deterministic;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Rewrite cold email subject and body so they pass Gmail/M365 spam filters. Keep personalization tokens like {{first_name}} verbatim. Avoid hype, ALL CAPS, URL shorteners, and guarantees. Return JSON: { subject: string, body: string }.",
          },
          {
            role: "user",
            content: JSON.stringify({ subject, body }),
          },
        ],
      }),
    });
    clearTimeout(timer);
    if (!res.ok) return deterministic;
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return deterministic;
    const parsed = JSON.parse(content) as { subject?: string; body?: string };
    if (!parsed.subject || !parsed.body) return deterministic;

    const afterAnalysis = analyzeSpamCopy(parsed.subject, parsed.body);
    if (afterAnalysis.spamScore > deterministic.afterAnalysis.spamScore) {
      return deterministic;
    }

    const scoreDrop = Math.max(0, deterministic.beforeAnalysis.spamScore - afterAnalysis.spamScore);
    return {
      beforeAnalysis: deterministic.beforeAnalysis,
      afterAnalysis,
      rewrittenSubject: parsed.subject,
      rewrittenBody: parsed.body,
      sentenceDiffs: deterministic.sentenceDiffs,
      projectedInboxLiftPct: Math.min(45, Math.round(scoreDrop * 0.5)),
      usedLlm: true,
    };
  } catch {
    return deterministic;
  }
}
