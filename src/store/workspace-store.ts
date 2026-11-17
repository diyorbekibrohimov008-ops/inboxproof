export interface WorkspacePlan {
  id: "solopreneur" | "growth";
  name: string;
  priceUsdMonthly: number;
  monthlyLimit: number;
}

export interface StoredReportSummary {
  id: string;
  domain: string;
  subject: string;
  inboxPct: number;
  spamScore: number;
  authScore: number;
  createdAt: string;
  report: unknown;
}

export interface WorkspaceState {
  workspaceId: string;
  plan: WorkspacePlan;
  creditsUsed: number;
  creditsRemaining: number;
  billingCycleResetsAt: string;
}

export interface WorkspaceStore {
  getWorkspace(workspaceId: string): Promise<WorkspaceState>;
  consumeCreditAndSaveReport(workspaceId: string, entry: StoredReportSummary): Promise<WorkspaceState>;
  listReports(workspaceId: string): Promise<StoredReportSummary[]>;
  getReport(workspaceId: string, reportId: string): Promise<StoredReportSummary | null>;
  resetSandboxCredits(workspaceId: string): Promise<WorkspaceState>;
  switchPlan(workspaceId: string, planId: "solopreneur" | "growth"): Promise<WorkspaceState>;
}

const PLANS: Record<"solopreneur" | "growth", WorkspacePlan> = {
  solopreneur: {
    id: "solopreneur",
    name: "Solopreneur",
    priceUsdMonthly: 19,
    monthlyLimit: 20,
  },
  growth: {
    id: "growth",
    name: "Growth",
    priceUsdMonthly: 39,
    monthlyLimit: 75,
  },
};

function nextMonthResetIso(): string {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return next.toISOString();
}

export function createWorkspaceStore(): WorkspaceStore {
  const workspaces = new Map<string, { planId: "solopreneur" | "growth"; creditsUsed: number }>();
  const reports = new Map<string, StoredReportSummary[]>();

  function ensureWs(workspaceId: string) {
    let ws = workspaces.get(workspaceId);
    if (!ws) {
      ws = { planId: "solopreneur", creditsUsed: 0 };
      workspaces.set(workspaceId, ws);
    }
    return ws;
  }

  function formatState(workspaceId: string): WorkspaceState {
    const ws = ensureWs(workspaceId);
    const plan = PLANS[ws.planId];
    return {
      workspaceId,
      plan,
      creditsUsed: ws.creditsUsed,
      creditsRemaining: Math.max(0, plan.monthlyLimit - ws.creditsUsed),
      billingCycleResetsAt: nextMonthResetIso(),
    };
  }

  return {
    async getWorkspace(workspaceId: string): Promise<WorkspaceState> {
      return formatState(workspaceId);
    },

    async consumeCreditAndSaveReport(
      workspaceId: string,
      entry: StoredReportSummary,
    ): Promise<WorkspaceState> {
      const ws = ensureWs(workspaceId);
      const plan = PLANS[ws.planId];
      if (ws.creditsUsed >= plan.monthlyLimit) {
        throw new Error(
          `Monthly placement test limit reached (${plan.monthlyLimit}/${plan.monthlyLimit} used on ${plan.name} $${plan.priceUsdMonthly}/mo plan).`,
        );
      }
      ws.creditsUsed += 1;
      const list = reports.get(workspaceId) ?? [];
      list.unshift(entry);
      if (list.length > 50) list.pop();
      reports.set(workspaceId, list);
      return formatState(workspaceId);
    },

    async listReports(workspaceId: string): Promise<StoredReportSummary[]> {
      return [...(reports.get(workspaceId) ?? [])];
    },

    async getReport(workspaceId: string, reportId: string): Promise<StoredReportSummary | null> {
      return (reports.get(workspaceId) ?? []).find((r) => r.id === reportId) ?? null;
    },

    async resetSandboxCredits(workspaceId: string): Promise<WorkspaceState> {
      const ws = ensureWs(workspaceId);
      ws.creditsUsed = 0;
      return formatState(workspaceId);
    },

    async switchPlan(workspaceId: string, planId: "solopreneur" | "growth"): Promise<WorkspaceState> {
      const ws = ensureWs(workspaceId);
      ws.planId = planId;
      return formatState(workspaceId);
    },
  };
}

interface BunSqlClient {
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<Array<Record<string, unknown>>>;
}

export function createAutoWorkspaceStore(): { store: WorkspaceStore; mode: "postgres" | "memory" } {
  const globalAny = globalThis as unknown as {
    Bun?: { env?: Record<string, string | undefined>; sql?: BunSqlClient };
  };
  const dbUrl = globalAny.Bun?.env?.DATABASE_URL ?? process.env?.DATABASE_URL;
  const sql = globalAny.Bun?.sql;

  if (!dbUrl || !sql) {
    return { store: createWorkspaceStore(), mode: "memory" };
  }

  const memoryFallback = createWorkspaceStore();
  let schemaReady: Promise<void> | null = null;

  async function ensureSchema() {
    if (!schemaReady) {
      schemaReady = (async () => {
        await sql`
          CREATE TABLE IF NOT EXISTS workspaces (
            workspace_id TEXT PRIMARY KEY,
            plan_id TEXT NOT NULL DEFAULT 'solopreneur',
            credits_used INTEGER NOT NULL DEFAULT 0,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `;
        await sql`
          CREATE TABLE IF NOT EXISTS placement_reports (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL,
            domain TEXT NOT NULL,
            subject TEXT NOT NULL,
            inbox_pct INTEGER NOT NULL,
            spam_score INTEGER NOT NULL,
            auth_score INTEGER NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            report_json TEXT NOT NULL
          )
        `;
      })().catch((err) => {
        schemaReady = null;
        throw err;
      });
    }
    await schemaReady;
  }

  function toState(workspaceId: string, planId: string, creditsUsed: number): WorkspaceState {
    const plan = PLANS[planId === "growth" ? "growth" : "solopreneur"];
    return {
      workspaceId,
      plan,
      creditsUsed,
      creditsRemaining: Math.max(0, plan.monthlyLimit - creditsUsed),
      billingCycleResetsAt: nextMonthResetIso(),
    };
  }

  const pgStore: WorkspaceStore = {
    async getWorkspace(workspaceId: string): Promise<WorkspaceState> {
      try {
        await ensureSchema();
        await sql`
          INSERT INTO workspaces (workspace_id, plan_id, credits_used)
          VALUES (${workspaceId}, 'solopreneur', 0)
          ON CONFLICT (workspace_id) DO NOTHING
        `;
        const rows = await sql`
          SELECT workspace_id, plan_id, credits_used FROM workspaces WHERE workspace_id = ${workspaceId}
        `;
        const row = rows[0];
        return toState(workspaceId, String(row?.plan_id ?? "solopreneur"), Number(row?.credits_used ?? 0));
      } catch {
        return memoryFallback.getWorkspace(workspaceId);
      }
    },

    async consumeCreditAndSaveReport(
      workspaceId: string,
      entry: StoredReportSummary,
    ): Promise<WorkspaceState> {
      try {
        await ensureSchema();
        const current = await pgStore.getWorkspace(workspaceId);
        if (current.creditsRemaining <= 0) {
          throw new Error(
            `Monthly placement test limit reached (${current.plan.monthlyLimit}/${current.plan.monthlyLimit} used on ${current.plan.name} $${current.plan.priceUsdMonthly}/mo plan).`,
          );
        }
        const nextUsed = current.creditsUsed + 1;
        await sql`
          UPDATE workspaces SET credits_used = ${nextUsed}, updated_at = NOW()
          WHERE workspace_id = ${workspaceId}
        `;
        await sql`
          INSERT INTO placement_reports (id, workspace_id, domain, subject, inbox_pct, spam_score, auth_score, created_at, report_json)
          VALUES (
            ${entry.id},
            ${workspaceId},
            ${entry.domain},
            ${entry.subject},
            ${entry.inboxPct},
            ${entry.spamScore},
            ${entry.authScore},
            ${entry.createdAt},
            ${JSON.stringify(entry.report)}
          )
          ON CONFLICT (id) DO NOTHING
        `;
        return toState(workspaceId, current.plan.id, nextUsed);
      } catch (err) {
        if (err instanceof Error && err.message.includes("Monthly placement test limit reached")) {
          throw err;
        }
        return memoryFallback.consumeCreditAndSaveReport(workspaceId, entry);
      }
    },

    async listReports(workspaceId: string): Promise<StoredReportSummary[]> {
      try {
        await ensureSchema();
        const rows = await sql`
          SELECT id, domain, subject, inbox_pct, spam_score, auth_score, created_at, report_json
          FROM placement_reports
          WHERE workspace_id = ${workspaceId}
          ORDER BY created_at DESC
          LIMIT 30
        `;
        return rows.map((r) => ({
          id: String(r.id),
          domain: String(r.domain),
          subject: String(r.subject),
          inboxPct: Number(r.inbox_pct),
          spamScore: Number(r.spam_score),
          authScore: Number(r.auth_score),
          createdAt: new Date(String(r.created_at)).toISOString(),
          report: JSON.parse(String(r.report_json)),
        }));
      } catch {
        return memoryFallback.listReports(workspaceId);
      }
    },

    async getReport(workspaceId: string, reportId: string): Promise<StoredReportSummary | null> {
      try {
        await ensureSchema();
        const rows = await sql`
          SELECT id, domain, subject, inbox_pct, spam_score, auth_score, created_at, report_json
          FROM placement_reports
          WHERE workspace_id = ${workspaceId} AND id = ${reportId}
          LIMIT 1
        `;
        const r = rows[0];
        if (!r) return null;
        return {
          id: String(r.id),
          domain: String(r.domain),
          subject: String(r.subject),
          inboxPct: Number(r.inbox_pct),
          spamScore: Number(r.spam_score),
          authScore: Number(r.auth_score),
          createdAt: new Date(String(r.created_at)).toISOString(),
          report: JSON.parse(String(r.report_json)),
        };
      } catch {
        return memoryFallback.getReport(workspaceId, reportId);
      }
    },

    async resetSandboxCredits(workspaceId: string): Promise<WorkspaceState> {
      try {
        await ensureSchema();
        await sql`
          UPDATE workspaces SET credits_used = 0, updated_at = NOW()
          WHERE workspace_id = ${workspaceId}
        `;
        return pgStore.getWorkspace(workspaceId);
      } catch {
        return memoryFallback.resetSandboxCredits(workspaceId);
      }
    },

    async switchPlan(workspaceId: string, planId: "solopreneur" | "growth"): Promise<WorkspaceState> {
      try {
        await ensureSchema();
        await sql`
          INSERT INTO workspaces (workspace_id, plan_id, credits_used)
          VALUES (${workspaceId}, ${planId}, 0)
          ON CONFLICT (workspace_id) DO UPDATE SET plan_id = ${planId}, updated_at = NOW()
        `;
        return pgStore.getWorkspace(workspaceId);
      } catch {
        return memoryFallback.switchPlan(workspaceId, planId);
      }
    },
  };

  return { store: pgStore, mode: "postgres" };
}
