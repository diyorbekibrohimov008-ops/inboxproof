import {
  createHybridResolver,
  diagnoseDomain,
  type DnsResolver,
} from "./dns/diagnostics.ts";
import { buildRemediationPlan, type ProviderPreset } from "./dns/remediation.ts";
import {
  analyzeSpamCopy,
  rewriteSpamCopyWithOptionalLlm,
} from "./copy/spam-analyzer.ts";
import { parseEmailHeaders, runPlacementTest } from "./placement/seed-engine.ts";
import {
  createAutoWorkspaceStore,
  createWorkspaceStore,
  type WorkspaceStore,
} from "./store/workspace-store.ts";
import { renderAppHtml } from "./ui/app.ts";

export interface AppHandlerOptions {
  resolver?: DnsResolver;
  store?: WorkspaceStore;
  persistenceMode?: "postgres" | "memory";
}

const BASE_SECURITY_HEADERS = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

const SECURITY_HEADERS = {
  ...BASE_SECURITY_HEADERS,
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
};

async function computeInlineScriptCsp(html: string): Promise<string> {
  const hashes: string[] = [];
  const encoder = new TextEncoder();
  const tagOpen = "<script";
  const tagClose = "</script>";
  let pos = 0;
  while (pos < html.length) {
    const start = html.indexOf(tagOpen, pos);
    if (start === -1) break;
    const gt = html.indexOf(">", start);
    const end = gt === -1 ? -1 : html.indexOf(tagClose, gt + 1);
    if (gt === -1 || end === -1) break;
    const body = html.slice(gt + 1, end);
    if (body.trim().length > 0) {
      const digest = await globalThis.crypto.subtle.digest("SHA-256", encoder.encode(body));
      const b64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
      hashes.push(`'sha256-${b64}'`);
    }
    pos = end + tagClose.length;
  }
  const scriptSrc = hashes.length > 0 ? `'self' ${hashes.join(" ")}` : "'self'";
  return `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...SECURITY_HEADERS,
    },
  });
}

async function readJsonBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const parsed = await req.json();
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    throw new Error("Invalid JSON request body.");
  }
}

export function createAppHandler(options: AppHandlerOptions = {}) {
  const resolver = options.resolver ?? createHybridResolver();
  const auto = options.store
    ? { store: options.store, mode: options.persistenceMode ?? ("memory" as const) }
    : createAutoWorkspaceStore();
  const store = auto.store;
  const html = renderAppHtml();
  let cachedHtmlCsp: string | null = null;

  return async function handleRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const rewrittenPath = url.searchParams.get("__path");
    const rawPath =
      (url.pathname === "/api/index" || url.pathname === "/api/index.js" || url.pathname === "/api") &&
      rewrittenPath !== null
        ? rewrittenPath.startsWith("/")
          ? rewrittenPath
          : `/${rewrittenPath}`
        : url.pathname;
    const path = rawPath.length > 1 ? rawPath.replace(/\/+$/, "") : rawPath;
    const method = req.method.toUpperCase();

    try {
      if (method === "GET" && path === "/") {
        if (!cachedHtmlCsp) {
          cachedHtmlCsp = await computeInlineScriptCsp(html);
        }
        return new Response(html, {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            ...BASE_SECURITY_HEADERS,
            "Content-Security-Policy": cachedHtmlCsp,
          },
        });
      }

      if (method === "GET" && path === "/favicon.ico") {
        return new Response(
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#0369a1"/><text x="16" y="21" font-family="sans-serif" font-size="14" font-weight="800" fill="#fff" text-anchor="middle">IP</text></svg>',
          {
            status: 200,
            headers: {
              "Content-Type": "image/svg+xml",
              "Cache-Control": "public, max-age=86400",
              ...SECURITY_HEADERS,
            },
          },
        );
      }

      if (method === "GET" && path === "/health") {
        return json({
          status: "ok",
          service: "inboxproof",
          persistence: auto.mode,
          timestamp: new Date().toISOString(),
        });
      }

      if (method === "GET" && path === "/api/workspace") {
        const workspaceId = url.searchParams.get("workspaceId")?.trim() || "ws-default";
        const [workspace, reports] = await Promise.all([
          store.getWorkspace(workspaceId),
          store.listReports(workspaceId),
        ]);
        return json({ workspace, reports });
      }

      if (method === "POST" && path === "/api/workspace/reset-sandbox") {
        const body = await readJsonBody(req);
        const workspaceId = String(body.workspaceId || "ws-default").trim();
        const workspace = await store.resetSandboxCredits(workspaceId);
        return json({ workspace });
      }

      if (method === "POST" && path === "/api/workspace/plan") {
        const body = await readJsonBody(req);
        const workspaceId = String(body.workspaceId || "ws-default").trim();
        const planId = body.planId === "growth" ? "growth" : "solopreneur";
        const workspace = await store.switchPlan(workspaceId, planId);
        return json({ workspace });
      }

      if (method === "POST" && path === "/api/copy/analyze") {
        const body = await readJsonBody(req);
        const subject = String(body.subject ?? "");
        const emailBody = String(body.body ?? "");
        return json(analyzeSpamCopy(subject, emailBody));
      }

      if (method === "POST" && path === "/api/copy/rewrite") {
        const body = await readJsonBody(req);
        const subject = String(body.subject ?? "");
        const emailBody = String(body.body ?? "");
        const rewritten = await rewriteSpamCopyWithOptionalLlm(subject, emailBody);
        return json(rewritten);
      }

      if (method === "POST" && path === "/api/diagnose/dns") {
        const body = await readJsonBody(req);
        const domainOrEmail = String(body.domainOrEmail ?? body.fromEmail ?? "").trim();
        if (!domainOrEmail) {
          return json({ error: "Please provide a domain or sender email address." }, 400);
        }
        const selector = typeof body.selector === "string" ? body.selector.trim() : undefined;
        const providerPreset = (typeof body.providerPreset === "string"
          ? body.providerPreset
          : "google-workspace") as ProviderPreset;

        const diagnostics = await diagnoseDomain(domainOrEmail, {
          selector: selector || undefined,
          resolver,
        });
        const remediation = buildRemediationPlan(diagnostics, {
          providerPreset,
          fromEmail: domainOrEmail.includes("@") ? domainOrEmail : `outreach@${diagnostics.domain}`,
        });
        return json({ diagnostics, remediation });
      }

      if (method === "POST" && path === "/api/tests/run") {
        const body = await readJsonBody(req);
        const workspaceId = String(body.workspaceId || "ws-default").trim();
        const rawHeaders = typeof body.rawHeaders === "string" ? body.rawHeaders : "";
        const parsedHeaders = rawHeaders.trim() ? parseEmailHeaders(rawHeaders) : null;

        const fromEmail = String(
          body.fromEmail || parsedHeaders?.fromDomain || "",
        ).trim();
        if (!fromEmail) {
          return json({ error: "Please enter a From email address or sending domain." }, 400);
        }

        const selector =
          (typeof body.selector === "string" && body.selector.trim()) ||
          parsedHeaders?.dkimSelector ||
          undefined;

        const providerPreset = (typeof body.providerPreset === "string"
          ? body.providerPreset
          : "google-workspace") as ProviderPreset;

        const subject = String(body.subject || parsedHeaders?.subject || "(No subject)");
        const emailBody = String(body.body || parsedHeaders?.body || "");

        const existingWs = await store.getWorkspace(workspaceId);
        if (existingWs.creditsRemaining <= 0) {
          return json(
            {
              error: `Monthly placement test limit reached (${existingWs.plan.monthlyLimit}/${existingWs.plan.monthlyLimit} used on ${existingWs.plan.name} $${existingWs.plan.priceUsdMonthly}/mo). Reset sandbox credits or upgrade plan.`,
            },
            402,
          );
        }

        const diagnostics = await diagnoseDomain(fromEmail, { selector, resolver });
        const report = runPlacementTest({
          diagnostics,
          subject,
          body: emailBody,
          fromEmail: fromEmail.includes("@") ? fromEmail : `outreach@${diagnostics.domain}`,
          providerPreset,
          rawHeaders: rawHeaders.trim() ? rawHeaders : undefined,
        });

        const workspace = await store.consumeCreditAndSaveReport(workspaceId, {
          id: report.id,
          domain: report.domain,
          subject,
          inboxPct: report.summary.inboxPct,
          spamScore: report.copyAnalysis.spamScore,
          authScore: report.diagnostics.authScore,
          createdAt: report.createdAt,
          report,
        });

        return json({ report, workspace });
      }

      if (method === "GET" && path.startsWith("/api/reports/")) {
        const reportId = path.slice("/api/reports/".length).trim();
        const workspaceId = url.searchParams.get("workspaceId")?.trim() || "ws-default";
        const found = await store.getReport(workspaceId, reportId);
        if (!found) return json({ error: "Report not found." }, 404);
        return json(found);
      }

      return json({ error: "Not found" }, 404);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected server error";
      const status = message.includes("Invalid domain") || message.includes("Invalid JSON") ? 400 : 500;
      return json({ error: message }, status);
    }
  };
}
