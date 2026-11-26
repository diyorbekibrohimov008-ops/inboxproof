export interface WorkspacePlan {
  id: "free";
  name: string;
  priceUsdMonthly: number;
  monthlyLimit: number | null;
  unlimited: boolean;
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
  testsRun: number;
  creditsUsed: number;
  creditsRemaining: number | null;
  unlimited: boolean;
  billingCycleResetsAt: string | null;
}

export interface WorkspaceStore {
  getWorkspace(workspaceId: string): Promise<WorkspaceState>;
  consumeCreditAndSaveReport(workspaceId: string, entry: StoredReportSummary): Promise<WorkspaceState>;
  listReports(workspaceId: string): Promise<StoredReportSummary[]>;
  getReport(workspaceId: string, reportId: string): Promise<StoredReportSummary | null>;
  resetSandboxCredits(workspaceId: string): Promise<WorkspaceState>;
  switchPlan(workspaceId: string, planId?: string): Promise<WorkspaceState>;
}

const FREE_PLAN: WorkspacePlan = {
  id: "free",
  name: "Free Forever",
  priceUsdMonthly: 0,
  monthlyLimit: null,
  unlimited: true,
};

export function createWorkspaceStore(): WorkspaceStore {
  const workspaces = new Map<string, { testsRun: number }>();
  const reports = new Map<string, StoredReportSummary[]>();

  function ensureWs(workspaceId: string) {
    let ws = workspaces.get(workspaceId);
    if (!ws) {
      ws = { testsRun: 0 };
      workspaces.set(workspaceId, ws);
    }
    return ws;
  }

  function formatState(workspaceId: string): WorkspaceState {
    const ws = ensureWs(workspaceId);
    return {
      workspaceId,
      plan: FREE_PLAN,
      testsRun: ws.testsRun,
      creditsUsed: ws.testsRun,
      creditsRemaining: null,
      unlimited: true,
      billingCycleResetsAt: null,
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
      ws.testsRun += 1;
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
      ws.testsRun = 0;
      return formatState(workspaceId);
    },

    async switchPlan(workspaceId: string, _planId?: string): Promise<WorkspaceState> {
      ensureWs(workspaceId);
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
  const bunSql = globalAny.Bun?.sql;

  if (!dbUrl || !bunSql) {
    return { store: createWorkspaceStore(), mode: "memory" };
  }

  const sql: BunSqlClient = bunSql;

  const memoryFallback = createWorkspaceStore();
  let schemaReady: Promise<void> | null = null;

  async function ensureSchema() {
    if (!schemaReady) {
      schemaReady = (async () => {
        await sql`
          CREATE TABLE IF NOT EXISTS workspaces (
            workspace_id TEXT PRIMARY KEY,
            plan_id TEXT NOT NULL DEFAULT 'free',
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

  function toState(workspaceId: string, testsRun: number): WorkspaceState {
    return {
      workspaceId,
      plan: FREE_PLAN,
      testsRun,
      creditsUsed: testsRun,
      creditsRemaining: null,
      unlimited: true,
      billingCycleResetsAt: null,
    };
  }

  const pgStore: WorkspaceStore = {
    async getWorkspace(workspaceId: string): Promise<WorkspaceState> {
      try {
        await ensureSchema();
        await sql`
          INSERT INTO workspaces (workspace_id, plan_id, credits_used)
          VALUES (${workspaceId}, 'free', 0)
          ON CONFLICT (workspace_id) DO NOTHING
        `;
        const rows = await sql`
          SELECT workspace_id, credits_used FROM workspaces WHERE workspace_id = ${workspaceId}
        `;
        const row = rows[0];
        return toState(workspaceId, Number(row?.credits_used ?? 0));
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
        const nextUsed = current.testsRun + 1;
        await sql`
          UPDATE workspaces SET plan_id = 'free', credits_used = ${nextUsed}, updated_at = NOW()
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
        return toState(workspaceId, nextUsed);
      } catch {
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
          UPDATE workspaces SET plan_id = 'free', credits_used = 0, updated_at = NOW()
          WHERE workspace_id = ${workspaceId}
        `;
        return pgStore.getWorkspace(workspaceId);
      } catch {
        return memoryFallback.resetSandboxCredits(workspaceId);
      }
    },

    async switchPlan(workspaceId: string, _planId?: string): Promise<WorkspaceState> {
      try {
        await ensureSchema();
        await sql`
          INSERT INTO workspaces (workspace_id, plan_id, credits_used)
          VALUES (${workspaceId}, 'free', 0)
          ON CONFLICT (workspace_id) DO UPDATE SET plan_id = 'free', updated_at = NOW()
        `;
        return pgStore.getWorkspace(workspaceId);
      } catch {
        return memoryFallback.switchPlan(workspaceId, "free");
      }
    },
  };

  return { store: pgStore, mode: "postgres" };
}
