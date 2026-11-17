export function renderAppHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>InboxProof — Cold Email Deliverability & One-Click DNS Fix ($19/mo)</title>
  <style>
    :root {
      --bg: #f6f7fb;
      --surface: #ffffff;
      --surface-muted: #f1f4f9;
      --border: #e2e8f0;
      --border-strong: #cbd5e1;
      --ink: #0f172a;
      --ink-secondary: #475569;
      --ink-muted: #64748b;
      --accent: #2563eb;
      --accent-hover: #1d4ed8;
      --accent-soft: #eff6ff;
      --pass: #059669;
      --pass-soft: #ecfdf5;
      --pass-border: #a7f3d0;
      --warn: #d97706;
      --warn-soft: #fffbeb;
      --warn-border: #fde68a;
      --fail: #e11d48;
      --fail-soft: #fff1f2;
      --fail-border: #fecdd3;
      --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      --sans: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --radius: 12px;
      --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.04);
      --shadow-md: 0 6px 20px rgba(15, 23, 42, 0.06);
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: var(--sans);
      background: var(--bg);
      color: var(--ink);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }

    .topbar {
      position: sticky;
      top: 0;
      z-index: 40;
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--border);
    }
    .topbar-inner {
      max-width: 1400px;
      margin: 0 auto;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-icon {
      width: 34px;
      height: 34px;
      border-radius: 9px;
      background: linear-gradient(135deg, #2563eb, #0ea5e9);
      color: #fff;
      display: grid;
      place-items: center;
      font-weight: 800;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
    }
    .brand-title {
      font-weight: 750;
      font-size: 16px;
      letter-spacing: -0.02em;
    }
    .brand-sub {
      font-size: 12px;
      color: var(--ink-muted);
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .credit-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 12px;
      background: var(--surface-muted);
      border: 1px solid var(--border);
      border-radius: 999px;
      font-size: 13px;
    }
    .credit-bar {
      width: 68px;
      height: 7px;
      background: #dbe3ef;
      border-radius: 999px;
      overflow: hidden;
    }
    .credit-fill {
      height: 100%;
      background: var(--pass);
      transition: width 0.25s ease;
    }
    .btn {
      appearance: none;
      border: 1px solid var(--border-strong);
      background: var(--surface);
      color: var(--ink);
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      padding: 8px 13px;
      border-radius: 9px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .btn:hover { background: var(--surface-muted); border-color: #94a3b8; }
    .btn:disabled { opacity: 0.55; cursor: not-allowed; }
    .btn-primary {
      background: var(--accent);
      border-color: var(--accent);
      color: #fff;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.22);
    }
    .btn-primary:hover { background: var(--accent-hover); border-color: var(--accent-hover); }
    .btn-success {
      background: var(--pass);
      border-color: var(--pass);
      color: #fff;
    }
    .btn-success:hover { background: #047857; }
    .btn-sm { padding: 5px 10px; font-size: 12px; border-radius: 7px; }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 18px 20px 44px;
    }

    .presets-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 16px;
      padding: 10px 14px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow-sm);
    }
    .presets-group {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .presets-label {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--ink-muted);
      margin-right: 4px;
    }
    .chip {
      border: 1px solid var(--border);
      background: var(--surface-muted);
      color: var(--ink-secondary);
      font-size: 12px;
      font-weight: 600;
      padding: 5px 10px;
      border-radius: 999px;
      cursor: pointer;
    }
    .chip:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }

    .workspace-grid {
      display: grid;
      grid-template-columns: 430px minmax(0, 1fr);
      gap: 18px;
      align-items: start;
    }
    @media (max-width: 1060px) {
      .workspace-grid { grid-template-columns: 1fr; }
    }

    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }
    .card-header {
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .card-title {
      font-size: 14px;
      font-weight: 700;
      margin: 0;
    }
    .card-body { padding: 16px; }

    .seg-control {
      display: inline-flex;
      background: var(--surface-muted);
      padding: 3px;
      border-radius: 9px;
      border: 1px solid var(--border);
    }
    .seg-btn {
      border: none;
      background: transparent;
      padding: 5px 11px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--ink-secondary);
      cursor: pointer;
    }
    .seg-btn.active {
      background: var(--surface);
      color: var(--ink);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
    }

    .field { margin-bottom: 12px; }
    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      font-weight: 600;
      color: var(--ink-secondary);
      margin-bottom: 5px;
    }
    input[type="text"], select, textarea {
      width: 100%;
      font-family: inherit;
      font-size: 13px;
      padding: 8px 10px;
      border: 1px solid var(--border-strong);
      border-radius: 8px;
      background: #fff;
      color: var(--ink);
      outline: none;
      transition: border-color 0.15s;
    }
    input[type="text"]:focus, select:focus, textarea:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
    }
    textarea { resize: vertical; min-height: 150px; line-height: 1.5; }
    textarea.mono { font-family: var(--mono); font-size: 12px; min-height: 220px; }

    .editor-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
      margin: 10px 0 8px;
      padding: 8px 10px;
      background: var(--surface-muted);
      border: 1px solid var(--border);
      border-radius: 8px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.01em;
    }
    .badge-pass { background: var(--pass-soft); color: var(--pass); border: 1px solid var(--pass-border); }
    .badge-warn { background: var(--warn-soft); color: var(--warn); border: 1px solid var(--warn-border); }
    .badge-fail { background: var(--fail-soft); color: var(--fail); border: 1px solid var(--fail-border); }
    .badge-info { background: var(--accent-soft); color: var(--accent); border: 1px solid #bfdbfe; }

    .highlight-surface {
      border: 1px solid var(--border-strong);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 13px;
      line-height: 1.65;
      background: #fff;
      white-space: pre-wrap;
      min-height: 150px;
    }
    .trig-critical {
      background: #ffe4e6;
      border-bottom: 2px solid #e11d48;
      color: #881337;
      padding: 1px 3px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
    }
    .trig-high {
      background: #fef3c7;
      border-bottom: 2px solid #d97706;
      color: #78350f;
      padding: 1px 3px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
    }
    .trig-medium {
      background: #e0f2fe;
      border-bottom: 2px solid #0284c7;
      color: #0c4a6e;
      padding: 1px 3px;
      border-radius: 4px;
      cursor: pointer;
    }

    .popover-box {
      margin-top: 8px;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid #bfdbfe;
      background: #f8fbff;
      font-size: 12px;
    }
    .suggestion-pill {
      display: inline-block;
      margin: 4px 5px 0 0;
      padding: 3px 9px;
      border-radius: 999px;
      border: 1px solid var(--accent);
      background: #fff;
      color: var(--accent);
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
    }
    .suggestion-pill:hover { background: var(--accent); color: #fff; }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }
    @media (max-width: 760px) {
      .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    .kpi-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 14px 15px;
      box-shadow: var(--shadow-sm);
    }
    .kpi-label { font-size: 12px; color: var(--ink-muted); font-weight: 600; }
    .kpi-val { font-size: 26px; font-weight: 800; letter-spacing: -0.03em; margin: 4px 0; }
    .kpi-sub { font-size: 12px; color: var(--ink-secondary); }

    .tabs-nav {
      display: flex;
      gap: 4px;
      border-bottom: 1px solid var(--border);
      padding: 0 14px;
      background: #fafbfd;
      overflow-x: auto;
    }
    .tab-btn {
      appearance: none;
      border: none;
      border-bottom: 2px solid transparent;
      background: transparent;
      padding: 12px 14px;
      font-family: inherit;
      font-size: 13px;
      font-weight: 650;
      color: var(--ink-muted);
      cursor: pointer;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .tab-btn.active {
      color: var(--accent);
      border-bottom-color: var(--accent);
      background: var(--surface);
    }
    .tab-panel { display: none; padding: 18px; }
    .tab-panel.active { display: block; }

    .stacked-bar {
      height: 16px;
      border-radius: 999px;
      overflow: hidden;
      display: flex;
      background: var(--surface-muted);
      border: 1px solid var(--border);
      margin: 10px 0 14px;
    }
    .bar-inbox { background: var(--pass); }
    .bar-promo { background: var(--warn); }
    .bar-spam { background: var(--fail); }

    .provider-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      margin-bottom: 16px;
    }
    @media (max-width: 760px) {
      .provider-grid { grid-template-columns: 1fr 1fr; }
    }
    .provider-card {
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 11px 12px;
      background: #fcfdff;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th, td {
      text-align: left;
      padding: 9px 10px;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
    }
    th {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--ink-muted);
      background: var(--surface-muted);
    }

    .fix-card {
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 14px;
      background: #fff;
    }
    .fix-card.critical { border-left: 4px solid var(--fail); }
    .fix-card.warning { border-left: 4px solid var(--warn); }

    .dns-record-box {
      margin-top: 10px;
      border: 1px solid var(--border);
      border-radius: 9px;
      overflow: hidden;
      background: #f8fafc;
    }
    .dns-kv {
      display: grid;
      grid-template-columns: 110px 1fr auto;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-bottom: 1px solid var(--border);
      font-size: 12px;
    }
    .dns-kv:last-child { border-bottom: none; }
    .dns-k { font-weight: 700; color: var(--ink-muted); text-transform: uppercase; font-size: 11px; }
    .dns-v {
      font-family: var(--mono);
      font-size: 12px;
      word-break: break-all;
      color: var(--ink);
    }

    .diff-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      padding: 10px;
      border: 1px solid var(--border);
      border-radius: 8px;
      margin-bottom: 8px;
      background: #fcfdff;
    }
    @media (max-width: 720px) { .diff-row { grid-template-columns: 1fr; } }
    .diff-before {
      background: var(--fail-soft);
      border: 1px solid var(--fail-border);
      border-radius: 6px;
      padding: 8px 10px;
      font-size: 12.5px;
    }
    .diff-after {
      background: var(--pass-soft);
      border: 1px solid var(--pass-border);
      border-radius: 6px;
      padding: 8px 10px;
      font-size: 12.5px;
    }

    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
    }
    @media (max-width: 820px) { .pricing-grid { grid-template-columns: 1fr; } }
    .price-card {
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      background: #fff;
    }
    .price-card.featured {
      border: 2px solid var(--accent);
      box-shadow: var(--shadow-md);
      background: linear-gradient(180deg, #f8fbff 0%, #ffffff 40%);
    }

    .notice {
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 12.5px;
      background: var(--surface-muted);
      border: 1px solid var(--border);
      color: var(--ink-secondary);
    }
    .toast {
      position: fixed;
      right: 20px;
      bottom: 20px;
      background: #0f172a;
      color: #fff;
      padding: 10px 15px;
      border-radius: 9px;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.25);
      opacity: 0;
      transform: translateY(8px);
      transition: all 0.2s ease;
      pointer-events: none;
      z-index: 99;
    }
    .toast.show { opacity: 1; transform: translateY(0); }
    .hidden { display: none !important; }
    .muted { color: var(--ink-muted); font-size: 12px; }
    .mono { font-family: var(--mono); }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="topbar-inner">
      <div class="brand">
        <div class="brand-icon">IP</div>
        <div>
          <div class="brand-title">InboxProof <span class="badge badge-info">Solopreneur \$19/mo</span></div>
          <div class="brand-sub">Cold Email Placement, One-Click DNS Fixes & Live Spam Rewriter</div>
        </div>
      </div>

      <div class="topbar-right">
        <div class="credit-pill" title="20 deep placement tests/month on Solopreneur $19/mo">
          <strong id="planBadge">Solopreneur (\$19/mo)</strong>
          <span>·</span>
          <span id="creditsText">20 / 20 tests left</span>
          <div class="credit-bar"><div id="creditFill" class="credit-fill" style="width:100%"></div></div>
        </div>
        <button class="btn btn-sm" id="resetCreditsBtn" type="button">Reset Sandbox Credits</button>
        <button class="btn btn-sm" id="jumpPricingBtn" type="button">\$19/mo vs GlockApps (\$85–\$185)</button>
      </div>
    </div>
  </header>

  <main class="container">
    <section class="presets-bar">
      <div class="presets-group">
        <span class="presets-label">Try Scenario:</span>
        <button class="chip" type="button" data-preset="healthy-live">Healthy Live DNS (resend.com)</button>
        <button class="chip" type="button" data-preset="broken-cold">Broken Cold Domain + Spam Pitch</button>
        <button class="chip" type="button" data-preset="promo-copy">Good DNS + High-Spam Copy</button>
        <button class="chip" type="button" data-preset="raw-headers">Misaligned Raw .eml Headers</button>
      </div>
      <div class="muted">Live Cloudflare/Google DNS lookups · Zero cryptic RFC errors</div>
    </section>

    <div class="workspace-grid">
      <!-- LEFT: INPUT & LIVE INLINE COPY EDITOR -->
      <section class="card">
        <div class="card-header">
          <h2 class="card-title">Diagnostic Studio</h2>
          <div class="seg-control">
            <button class="seg-btn active" type="button" id="modeDraftBtn">Domain + Draft</button>
            <button class="seg-btn" type="button" id="modeEmlBtn">Raw .eml Headers</button>
          </div>
        </div>
        <div class="card-body">
          <div id="draftFields">
            <div class="field">
              <label for="fromEmail">From Email or Sending Domain</label>
              <input id="fromEmail" type="text" value="alex@resend.com" placeholder="e.g. alex@outreach-acme.com" />
            </div>

            <div class="field-row">
              <div class="field">
                <label for="dkimSelector">DKIM Selector <span class="muted">(optional)</span></label>
                <input id="dkimSelector" type="text" placeholder="Auto-probe (google, s1...)" />
              </div>
              <div class="field">
                <label for="providerPreset">Sending Provider</label>
                <select id="providerPreset">
                  <option value="google-workspace">Google Workspace</option>
                  <option value="microsoft-365">Microsoft 365</option>
                  <option value="resend">Resend / SES</option>
                  <option value="postmark">Postmark</option>
                  <option value="zoho">Zoho Mail</option>
                  <option value="custom-smtp">Custom SMTP</option>
                </select>
              </div>
            </div>

            <div class="field">
              <label for="subjectInput">
                <span>Subject Line</span>
                <span id="liveSpamBadge" class="badge badge-pass">Spam Risk: 0/100</span>
              </label>
              <input id="subjectInput" type="text" value="Quick question on Q4 outbound at {{company}}" />
            </div>

            <div class="editor-toolbar">
              <div class="seg-control">
                <button class="seg-btn active" type="button" id="viewEditBtn">Edit Text</button>
                <button class="seg-btn" type="button" id="viewHighlightBtn">Highlight Triggers (<span id="triggerCount">0</span>)</button>
              </div>
              <button class="btn btn-sm btn-success" type="button" id="autoRewriteBtn">Auto-Rewrite Risky Copy</button>
            </div>

            <div id="editBox">
              <textarea id="bodyInput" placeholder="Write or paste your cold email draft...">Hi {{first_name}},

Noticed your team is hiring two new SDRs this quarter. How are you validating domain health before ramping daily send volume?

Happy to share a short 2-minute breakdown if helpful.

Best,
Alex</textarea>
            </div>

            <div id="highlightBox" class="hidden">
              <div class="muted" style="margin-bottom:4px">Subject highlights (click any highlighted phrase to replace):</div>
              <div id="subjectHighlightView" class="highlight-surface" style="min-height:auto;margin-bottom:8px"></div>
              <div class="muted" style="margin-bottom:4px">Body highlights:</div>
              <div id="bodyHighlightView" class="highlight-surface"></div>
              <div id="triggerPopover" class="popover-box hidden"></div>
            </div>

            <div id="inlineRewriteBanner" class="popover-box hidden" style="margin-top:10px">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px">
                <strong id="rewriteBannerTitle">Rewritten Copy Ready</strong>
                <div style="display:flex;gap:6px">
                  <button class="btn btn-sm btn-primary" type="button" id="applyRewriteBtn">Apply Clean Copy</button>
                  <button class="btn btn-sm" type="button" id="dismissRewriteBtn">Dismiss</button>
                </div>
              </div>
              <div id="rewriteBannerPreview" class="muted"></div>
            </div>
          </div>

          <div id="emlFields" class="hidden">
            <div class="field">
              <label for="rawHeadersInput">Paste Raw Email Source / SMTP Headers (.eml)</label>
              <textarea id="rawHeadersInput" class="mono" placeholder="From: Alex <alex@acme.io>&#10;Return-Path: <bounce@relay.net>&#10;DKIM-Signature: v=1; d=relay.net; s=s1; ...&#10;Authentication-Results: ..."></textarea>
            </div>
          </div>

          <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap">
            <button class="btn btn-primary" style="flex:1;justify-content:center" type="button" id="runTestBtn">
              Run Deep Placement Test (-1 Credit)
            </button>
            <button class="btn" type="button" id="dnsOnlyBtn">Check DNS Only (Free)</button>
          </div>
          <div id="runErrorBox" class="popover-box hidden" style="border-color:var(--fail-border);background:var(--fail-soft);color:#9f1239;margin-top:10px"></div>
        </div>
      </section>

      <!-- RIGHT: RESULTS WORKBENCH -->
      <section>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Inbox Placement</div>
            <div class="kpi-val" id="kpiInbox">--%</div>
            <div class="kpi-sub" id="kpiGrade">Run a test to inspect 18 global seeds</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">DNS Auth Score</div>
            <div class="kpi-val" id="kpiAuth">--/100</div>
            <div class="kpi-sub" id="kpiAuthPills">SPF · DKIM · DMARC · MX</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Spam Copy Risk</div>
            <div class="kpi-val" id="kpiSpam">--/100</div>
            <div class="kpi-sub" id="kpiSpamSub">Real-time trigger scan</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">vs GlockApps (\$85–\$185)</div>
            <div class="kpi-val" style="color:var(--pass)">\$19/mo</div>
            <div class="kpi-sub">Save \$66–\$166/mo · 20 deep tests</div>
          </div>
        </div>

        <div class="card">
          <nav class="tabs-nav">
            <button class="tab-btn active" type="button" data-tab="placement">Seed Placement</button>
            <button class="tab-btn" type="button" data-tab="remediation">One-Click DNS Fix <span id="fixCountBadge" class="badge badge-pass">0</span></button>
            <button class="tab-btn" type="button" data-tab="rewriter">Live Copy Rewriter</button>
            <button class="tab-btn" type="button" data-tab="history">Test History (<span id="historyCount">0</span>)</button>
            <button class="tab-btn" type="button" data-tab="pricing">Pricing & Switching</button>
          </nav>

          <!-- TAB 1: SEED PLACEMENT -->
          <div class="tab-panel active" id="tab-placement">
            <div id="placementEmpty" class="notice">
              Click <strong>Run Deep Placement Test</strong> to run live DNS lookups, copy diagnostics, and 18-node global seed placement across Google Workspace, Gmail, Microsoft 365, Outlook, Yahoo, and regional ISPs.
            </div>
            <div id="placementContent" class="hidden">
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
                <div>
                  <strong id="reportDomainHeader">domain.com</strong>
                  <span id="telemetryModeBadge" class="badge badge-info" style="margin-left:6px">Predictive Seed Engine</span>
                </div>
                <div style="display:flex;gap:8px;font-size:12px;font-weight:700">
                  <span style="color:var(--pass)" id="lblInbox">Inbox 0%</span>
                  <span style="color:var(--warn)" id="lblPromo">Promotions 0%</span>
                  <span style="color:var(--fail)" id="lblSpam">Spam 0%</span>
                </div>
              </div>

              <div class="stacked-bar">
                <div id="barInbox" class="bar-inbox" style="width:0%"></div>
                <div id="barPromo" class="bar-promo" style="width:0%"></div>
                <div id="barSpam" class="bar-spam" style="width:0%"></div>
              </div>

              <div class="provider-grid" id="providerGrid"></div>

              <div id="headerTelemetryCard" class="fix-card hidden" style="margin-bottom:14px">
                <strong style="font-size:13px">Parsed Raw .eml Header Alignment Telemetry</strong>
                <div id="headerTelemetryBody" style="margin-top:8px;font-size:12.5px"></div>
              </div>

              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px">
                <strong style="font-size:13px">Global Seed Inbox Breakdown (18 Nodes)</strong>
                <div class="seg-control">
                  <button class="seg-btn active" type="button" data-seed-filter="all">All</button>
                  <button class="seg-btn" type="button" data-seed-filter="inbox">Inbox</button>
                  <button class="seg-btn" type="button" data-seed-filter="promotions">Promotions</button>
                  <button class="seg-btn" type="button" data-seed-filter="spam">Spam</button>
                </div>
              </div>

              <div style="overflow-x:auto">
                <table>
                  <thead>
                    <tr>
                      <th>Seed Mailbox</th>
                      <th>Provider</th>
                      <th>Region</th>
                      <th>Folder</th>
                      <th>Diagnostic Reason</th>
                    </tr>
                  </thead>
                  <tbody id="seedsTableBody"></tbody>
                </table>
              </div>

              <div class="notice" style="margin-top:14px">
                <strong>Seed Engine Transparency:</strong> Placement scores are computed from live Cloudflare/Google DNS-over-HTTPS queries (MX, SPF, DKIM, DMARC, Spamhaus DBL), provider-specific filter rules (2024+ Google/Yahoo DMARC mandates, M365 Defender link sensitivity), and inline spam copy scoring. Connect real IMAP seed webhooks in production to blend live mailbox polling.
              </div>
            </div>
          </div>

          <!-- TAB 2: ONE-CLICK DNS REMEDIATION -->
          <div class="tab-panel" id="tab-remediation">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px">
              <div>
                <div class="seg-control" id="registrarSwitcher">
                  <button class="seg-btn active" type="button" data-registrar="cloudflare">Cloudflare</button>
                  <button class="seg-btn" type="button" data-registrar="godaddy">GoDaddy</button>
                  <button class="seg-btn" type="button" data-registrar="namecheap">Namecheap</button>
                  <button class="seg-btn" type="button" data-registrar="route53">Route 53</button>
                </div>
              </div>
              <button class="btn btn-sm btn-primary" type="button" id="reverifyDnsBtn">Re-Verify Live DNS (Free)</button>
            </div>

            <div id="spfFlattenerNotice" class="popover-box hidden" style="margin-bottom:12px"></div>
            <div id="remediationCards"></div>
            <div id="healthyChecksList" style="margin-top:12px"></div>

            <details style="margin-top:16px">
              <summary style="cursor:pointer;font-size:13px;font-weight:700;color:var(--ink-secondary)">Raw DNS Records & Technical Telemetry (Power Users)</summary>
              <pre id="rawDnsPre" style="margin-top:8px;padding:12px;background:#0f172a;color:#e2e8f0;border-radius:8px;font-size:12px;overflow:auto"></pre>
            </details>
          </div>

          <!-- TAB 3: LIVE COPY REWRITER -->
          <div class="tab-panel" id="tab-rewriter">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px">
              <div>
                <strong style="font-size:14px">Sentence-Level Spam Copy Rewriter</strong>
                <div class="muted">Rewrites spam-trigger sentences into natural B2B cold email copy while preserving {{tokens}}.</div>
              </div>
              <div style="display:flex;gap:8px">
                <button class="btn btn-success btn-sm" type="button" id="tabRewriteBtn">Auto-Rewrite All Risky Sentences</button>
                <button class="btn btn-primary btn-sm hidden" type="button" id="tabApplyAndRetestBtn">Apply & Re-Run Placement Test</button>
              </div>
            </div>

            <div id="rewriterSummaryStrip" class="notice" style="margin-bottom:12px">
              Live scan active. Edit your draft on the left or click <strong>Auto-Rewrite All Risky Sentences</strong>.
            </div>

            <div id="triggerBreakdownList" style="margin-bottom:16px"></div>
            <div id="sentenceDiffContainer"></div>
          </div>

          <!-- TAB 4: TEST HISTORY -->
          <div class="tab-panel" id="tab-history">
            <div id="historyList"></div>
          </div>

          <!-- TAB 5: PRICING & SWITCHING -->
          <div class="tab-panel" id="tab-pricing">
            <div class="notice" style="margin-bottom:16px">
              <strong>Why switch from GlockApps or MailReach?</strong> Incumbents charge \$85–\$185/mo and hide plain-English DNS fixes behind raw RFC error codes. InboxProof gives indie sales reps and founders full placement diagnostics, copy-paste Cloudflare/GoDaddy remediation, and live spam rewriting for <strong>\$19/month</strong>.
            </div>
            <div class="pricing-grid">
              <div class="price-card featured">
                <span class="badge badge-pass">Most Popular · Solopreneur</span>
                <h3 style="margin:8px 0 4px">Solopreneur Tier</h3>
                <div style="font-size:28px;font-weight:800">\$19<span class="muted">/mo</span></div>
                <ul style="padding-left:18px;font-size:13px;color:var(--ink-secondary)">
                  <li><strong>20 deep placement tests/month</strong></li>
                  <li>Unlimited free live DNS re-verification</li>
                  <li>1-click Cloudflare, GoDaddy, Namecheap & Route 53 DNS fixes</li>
                  <li>Unlimited Live Spam Copy Rewriter scans</li>
                </ul>
                <button class="btn btn-primary" style="width:100%;justify-content:center" type="button" data-switch-plan="solopreneur">Select Solopreneur (\$19/mo)</button>
              </div>
              <div class="price-card">
                <span class="badge badge-info">Outbound Teams</span>
                <h3 style="margin:8px 0 4px">Growth Tier</h3>
                <div style="font-size:28px;font-weight:800">\$39<span class="muted">/mo</span></div>
                <ul style="padding-left:18px;font-size:13px;color:var(--ink-secondary)">
                  <li><strong>75 deep placement tests/month</strong></li>
                  <li>Multi-domain DNS monitoring & BIMI check</li>
                  <li>Raw .eml header alignment debugger</li>
                  <li>JSON & audit export reports</li>
                </ul>
                <button class="btn" style="width:100%;justify-content:center" type="button" data-switch-plan="growth">Select Growth (\$39/mo)</button>
              </div>
              <div class="price-card" style="background:var(--surface-muted)">
                <span class="badge badge-fail">Incumbents</span>
                <h3 style="margin:8px 0 4px">GlockApps / MailReach</h3>
                <div style="font-size:28px;font-weight:800;color:var(--ink-muted)">\$85–\$185<span class="muted">/mo</span></div>
                <ul style="padding-left:18px;font-size:13px;color:var(--ink-muted)">
                  <li>Strict credit rationing on entry plans</li>
                  <li>Cryptic "DKIM alignment failed on selector s1" errors</li>
                  <li>No registrar-specific GoDaddy/Cloudflare host guidance</li>
                  <li>No inline sentence-level copy rewriter</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </main>

  <div id="toast" class="toast">Copied to clipboard</div>

  <script>
    (function () {
      const WORKSPACE_KEY = "inboxproof_workspace_id";
      const HISTORY_KEY = "inboxproof_history_v1";

      let workspaceId = localStorage.getItem(WORKSPACE_KEY);
      if (!workspaceId) {
        workspaceId = "ws-" + Math.random().toString(36).slice(2, 10);
        localStorage.setItem(WORKSPACE_KEY, workspaceId);
      }

      const state = {
        mode: "draft", // draft | eml
        editorView: "edit", // edit | highlight
        registrar: "cloudflare",
        seedFilter: "all",
        latestCopyAnalysis: null,
        latestRewrite: null,
        latestReport: null,
        latestDnsOnly: null,
        history: [],
      };

      try {
        const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
        if (Array.isArray(saved)) state.history = saved;
      } catch {}

      const el = (id) => document.getElementById(id);

      function esc(str) {
        return String(str ?? "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      function toast(msg) {
        const t = el("toast");
        t.textContent = msg;
        t.classList.add("show");
        setTimeout(() => t.classList.remove("show"), 2000);
      }

      async function copyText(text) {
        try {
          await navigator.clipboard.writeText(text);
          toast("Copied to clipboard");
        } catch {
          toast("Copy failed — select manually");
        }
      }

      async function api(path, opts = {}) {
        const res = await fetch(path, {
          headers: { "Content-Type": "application/json" },
          ...opts,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Request failed");
        return data;
      }

      function updateCreditUi(ws) {
        if (!ws) return;
        el("planBadge").textContent = ws.plan.name + " ($" + ws.plan.priceUsdMonthly + "/mo)";
        el("creditsText").textContent = ws.creditsRemaining + " / " + ws.plan.monthlyLimit + " tests left";
        const pct = ws.plan.monthlyLimit > 0 ? Math.round((ws.creditsRemaining / ws.plan.monthlyLimit) * 100) : 0;
        const fill = el("creditFill");
        fill.style.width = pct + "%";
        fill.style.background = pct <= 20 ? "var(--fail)" : pct <= 45 ? "var(--warn)" : "var(--pass)";
      }

      async function loadWorkspace() {
        try {
          const data = await api("/api/workspace?workspaceId=" + encodeURIComponent(workspaceId));
          updateCreditUi(data.workspace);
          if (Array.isArray(data.reports) && data.reports.length > 0) {
            state.history = data.reports;
            localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history.slice(0, 20)));
          }
          renderHistory();
        } catch {}
      }

      function renderHighlightedText(text, triggers, targetKind) {
        if (!triggers || triggers.length === 0) return esc(text);
        let out = "";
        let cursor = 0;
        triggers.forEach((tr, idx) => {
          out += esc(text.slice(cursor, tr.start));
          const cls = tr.severity === "critical" ? "trig-critical" : tr.severity === "high" ? "trig-high" : "trig-medium";
          out += '<span class="' + cls + '" data-kind="' + targetKind + '" data-idx="' + idx + '">' + esc(text.slice(tr.start, tr.end)) + "</span>";
          cursor = tr.end;
        });
        out += esc(text.slice(cursor));
        return out;
      }

      function renderLiveCopyState() {
        const a = state.latestCopyAnalysis;
        if (!a) return;
        const badge = el("liveSpamBadge");
        badge.textContent = "Spam Risk: " + a.spamScore + "/100";
        badge.className = "badge " + (a.spamScore >= 50 ? "badge-fail" : a.spamScore >= 20 ? "badge-warn" : "badge-pass");
        el("kpiSpam").textContent = a.spamScore + "/100";
        el("kpiSpamSub").textContent = a.riskLevel.toUpperCase() + " · " + a.wordCount + " words · " + a.linkCount + " links";

        const totalTriggers = a.subjectTriggers.length + a.bodyTriggers.length;
        el("triggerCount").textContent = String(totalTriggers);

        el("subjectHighlightView").innerHTML = renderHighlightedText(el("subjectInput").value, a.subjectTriggers, "subject");
        el("bodyHighlightView").innerHTML = renderHighlightedText(el("bodyInput").value, a.bodyTriggers, "body");

        // Rewriter tab breakdown
        const breakdown = el("triggerBreakdownList");
        if (totalTriggers === 0) {
          breakdown.innerHTML = '<div class="badge badge-pass">No spam-trigger phrases detected — copy looks natural for 1:1 outreach.</div>';
        } else {
          const all = [
            ...a.subjectTriggers.map((t, i) => ({ ...t, loc: "Subject", kind: "subject", idx: i })),
            ...a.bodyTriggers.map((t, i) => ({ ...t, loc: "Body", kind: "body", idx: i })),
          ];
          breakdown.innerHTML =
            '<div style="font-size:13px;font-weight:700;margin-bottom:8px">Detected Spam Triggers (' + all.length + ')</div>' +
            all
              .map(
                (t) =>
                  '<div class="fix-card ' +
                  (t.severity === "critical" ? "critical" : "warning") +
                  '" style="padding:10px 12px;margin-bottom:8px">' +
                  '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">' +
                  '<div><span class="badge ' +
                  (t.severity === "critical" ? "badge-fail" : "badge-warn") +
                  '">' +
                  esc(t.loc + " · " + t.category) +
                  '</span> <strong style="margin-left:6px">"' +
                  esc(t.text) +
                  '"</strong></div>' +
                  '<span class="muted">+' +
                  t.points +
                  " spam pts</span></div>" +
                  '<div style="font-size:12.5px;color:var(--ink-secondary);margin-top:4px">' +
                  esc(t.reason) +
                  "</div>" +
                  '<div style="margin-top:4px">' +
                  t.suggestions
                    .map(
                      (s) =>
                        '<button type="button" class="suggestion-pill" data-replace-kind="' +
                        t.kind +
                        '" data-replace-start="' +
                        t.start +
                        '" data-replace-end="' +
                        t.end +
                        '" data-replace-val="' +
                        esc(s) +
                        '">Replace with "' +
                        esc(s) +
                        '"</button>',
                    )
                    .join("") +
                  "</div></div>",
              )
              .join("");
        }
      }

      let analyzeTimer = null;
      async function analyzeCopyNow() {
        try {
          const data = await api("/api/copy/analyze", {
            method: "POST",
            body: JSON.stringify({
              subject: el("subjectInput").value,
              body: el("bodyInput").value,
            }),
          });
          state.latestCopyAnalysis = data;
          renderLiveCopyState();
        } catch {}
      }

      function scheduleAnalyze() {
        clearTimeout(analyzeTimer);
        analyzeTimer = setTimeout(analyzeCopyNow, 180);
      }

      function replaceSpan(kind, start, end, replacement) {
        const input = kind === "subject" ? el("subjectInput") : el("bodyInput");
        const val = input.value;
        input.value = val.slice(0, start) + replacement + val.slice(end);
        el("triggerPopover").classList.add("hidden");
        analyzeCopyNow();
        toast("Replaced trigger phrase");
      }

      async function runAutoRewrite() {
        const btn = el("autoRewriteBtn");
        btn.disabled = true;
        btn.textContent = "Rewriting...";
        try {
          const data = await api("/api/copy/rewrite", {
            method: "POST",
            body: JSON.stringify({
              subject: el("subjectInput").value,
              body: el("bodyInput").value,
            }),
          });
          state.latestRewrite = data;
          el("inlineRewriteBanner").classList.remove("hidden");
          el("rewriteBannerTitle").textContent =
            "Spam Score: " +
            data.beforeAnalysis.spamScore +
            " -> " +
            data.afterAnalysis.spamScore +
            " (+" +
            data.projectedInboxLiftPct +
            "% est. inbox lift)";
          el("rewriteBannerPreview").innerHTML =
            "<div><strong>New Subject:</strong> " + esc(data.rewrittenSubject) + "</div>" +
            '<div style="margin-top:4px;white-space:pre-wrap"><strong>New Body Preview:</strong> ' +
            esc(data.rewrittenBody.slice(0, 220)) +
            (data.rewrittenBody.length > 220 ? "..." : "") +
            "</div>";

          el("rewriterSummaryStrip").innerHTML =
            "<strong>Rewrite Complete:</strong> Spam risk dropped from <strong>" +
            data.beforeAnalysis.spamScore +
            "</strong> to <strong>" +
            data.afterAnalysis.spamScore +
            "</strong> (+" +
            data.projectedInboxLiftPct +
            "% estimated inbox placement lift).";
          el("tabApplyAndRetestBtn").classList.remove("hidden");

          const diffBox = el("sentenceDiffContainer");
          if (data.sentenceDiffs.length === 0) {
            diffBox.innerHTML = '<div class="notice">Your draft is already clean — no risky sentences needed rewriting.</div>';
          } else {
            diffBox.innerHTML =
              '<div style="font-size:13px;font-weight:700;margin-bottom:8px">Before vs. After Sentence Diff</div>' +
              data.sentenceDiffs
                .map(
                  (d) =>
                    '<div class="diff-row">' +
                    '<div><div class="muted" style="margin-bottom:3px">Before</div><div class="diff-before">' +
                    esc(d.before) +
                    "</div></div>" +
                    '<div><div class="muted" style="margin-bottom:3px">After · ' +
                    esc(d.reason) +
                    '</div><div class="diff-after">' +
                    esc(d.after) +
                    "</div></div></div>",
                )
                .join("");
          }
        } catch (err) {
          toast(err.message);
        } finally {
          btn.disabled = false;
          btn.textContent = "Auto-Rewrite Risky Copy";
        }
      }

      function applyRewriteToEditor() {
        if (!state.latestRewrite) return;
        el("subjectInput").value = state.latestRewrite.rewrittenSubject;
        el("bodyInput").value = state.latestRewrite.rewrittenBody;
        el("inlineRewriteBanner").classList.add("hidden");
        analyzeCopyNow();
        toast("Applied clean copy to editor");
      }

      function renderDiagnosticsAndRemediation(diagnostics, remediation) {
        if (!diagnostics || !remediation) return;

        el("kpiAuth").textContent = diagnostics.authScore + "/100";
        el("kpiAuthPills").textContent =
          "SPF:" +
          diagnostics.spf.status.toUpperCase() +
          " · DKIM:" +
          diagnostics.dkim.status.toUpperCase() +
          " · DMARC:" +
          diagnostics.dmarc.status.toUpperCase();

        const fixBadge = el("fixCountBadge");
        fixBadge.textContent = String(remediation.fixes.length);
        fixBadge.className = "badge " + (remediation.fixes.length === 0 ? "badge-pass" : "badge-fail");

        const flat = el("spfFlattenerNotice");
        if (remediation.spfFlattenerTip) {
          flat.textContent = remediation.spfFlattenerTip;
          flat.classList.remove("hidden");
        } else {
          flat.classList.add("hidden");
        }

        const cardsEl = el("remediationCards");
        if (remediation.fixes.length === 0) {
          cardsEl.innerHTML =
            '<div class="fix-card" style="border-left:4px solid var(--pass)">' +
            "<strong>All core DNS records look healthy for " +
            esc(diagnostics.domain) +
            "!</strong>" +
            '<div class="muted" style="margin-top:4px">SPF, DKIM, DMARC, and MX are properly published.</div></div>';
        } else {
          cardsEl.innerHTML = remediation.fixes
            .map((fix) => {
              const rec = fix.recordsByRegistrar[state.registrar];
              return (
                '<div class="fix-card ' +
                fix.severity +
                '">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">' +
                '<div><span class="badge ' +
                (fix.severity === "critical" ? "badge-fail" : "badge-warn") +
                '">' +
                esc(fix.category) +
                '</span> <strong style="margin-left:6px">' +
                esc(fix.title) +
                "</strong></div>" +
                '<span class="muted">' +
                esc(rec.registrarLabel) +
                "</span></div>" +
                '<p style="font-size:13px;color:var(--ink-secondary);margin:8px 0">' +
                esc(fix.plainEnglishWhy) +
                "</p>" +
                '<ol style="margin:6px 0 10px;padding-left:18px;font-size:12.5px;color:var(--ink-secondary)">' +
                fix.howToFixSteps.map((s) => "<li>" + esc(s) + "</li>").join("") +
                "</ol>" +
                '<div class="dns-record-box">' +
                '<div class="dns-kv"><span class="dns-k">Type</span><span class="dns-v">' +
                esc(rec.type) +
                '</span><span></span></div>' +
                '<div class="dns-kv"><span class="dns-k">Host / Name</span><span class="dns-v">' +
                esc(rec.host) +
                '</span><button type="button" class="btn btn-sm" data-copy="' +
                esc(rec.host) +
                '">Copy Host</button></div>' +
                '<div class="dns-kv"><span class="dns-k">Value</span><span class="dns-v">' +
                esc(rec.value) +
                '</span><button type="button" class="btn btn-sm btn-primary" data-copy="' +
                esc(rec.value) +
                '">Copy Value</button></div>' +
                '<div class="dns-kv"><span class="dns-k">TTL</span><span class="dns-v">' +
                esc(rec.ttl) +
                (rec.proxyStatus ? " · Proxy: " + esc(rec.proxyStatus) : "") +
                '</span><span class="muted">' +
                esc(rec.note) +
                "</span></div></div></div>"
              );
            })
            .join("");
        }

        el("healthyChecksList").innerHTML = remediation.healthyChecks
          .map((item) => '<span class="badge badge-pass" style="margin:0 6px 6px 0">' + esc(item) + "</span>")
          .join("");

        el("rawDnsPre").textContent = JSON.stringify(
          {
            domain: diagnostics.domain,
            detectedProvider: diagnostics.detectedProvider,
            mx: diagnostics.mx.records,
            spf: diagnostics.spf,
            dkim: diagnostics.dkim,
            dmarc: diagnostics.dmarc,
            bimi: diagnostics.bimi,
            dnsbl: diagnostics.dnsbl,
          },
          null,
          2,
        );
      }

      function renderSeedsTable() {
        const report = state.latestReport;
        if (!report) return;
        const filtered =
          state.seedFilter === "all"
            ? report.seeds
            : report.seeds.filter((s) => s.folder === state.seedFilter);

        el("seedsTableBody").innerHTML = filtered
          .map((s) => {
            const cls = s.folder === "inbox" ? "badge-pass" : s.folder === "promotions" ? "badge-warn" : "badge-fail";
            return (
              "<tr>" +
              "<td><strong>" +
              esc(s.label) +
              "</strong></td>" +
              "<td>" +
              esc(s.providerGroup) +
              "</td>" +
              "<td>" +
              esc(s.region) +
              "</td>" +
              '<td><span class="badge ' +
              cls +
              '">' +
              esc(s.folder.toUpperCase()) +
              "</span></td>" +
              '<td style="color:var(--ink-secondary)">' +
              esc(s.reason) +
              "</td></tr>"
            );
          })
          .join("");
      }

      function renderReport(report) {
        state.latestReport = report;
        el("placementEmpty").classList.add("hidden");
        el("placementContent").classList.remove("hidden");

        el("kpiInbox").textContent = report.summary.inboxPct + "%";
        el("kpiInbox").style.color =
          report.summary.inboxPct >= 80 ? "var(--pass)" : report.summary.inboxPct >= 55 ? "var(--warn)" : "var(--fail)";
        el("kpiGrade").textContent =
          "Grade " + report.summary.grade + " · " + report.seeds.filter((s) => s.folder === "inbox").length + "/18 primary inbox";

        el("reportDomainHeader").textContent = report.domain + " (" + report.diagnostics.detectedProvider + ")";
        el("telemetryModeBadge").textContent =
          report.telemetryMode === "header-telemetry-hybrid" ? "Header Telemetry + Seed Engine" : "Predictive Seed Engine";

        el("lblInbox").textContent = "Inbox " + report.summary.inboxPct + "%";
        el("lblPromo").textContent = "Promotions " + report.summary.promotionsPct + "%";
        el("lblSpam").textContent = "Spam " + report.summary.spamPct + "%";

        el("barInbox").style.width = report.summary.inboxPct + "%";
        el("barPromo").style.width = report.summary.promotionsPct + "%";
        el("barSpam").style.width = report.summary.spamPct + "%";

        el("providerGrid").innerHTML = report.providerBreakdown
          .map((p) => {
            const color = p.inboxPct >= 80 ? "var(--pass)" : p.inboxPct >= 50 ? "var(--warn)" : "var(--fail)";
            return (
              '<div class="provider-card">' +
              '<div style="display:flex;justify-content:space-between;align-items:center">' +
              '<strong style="font-size:12.5px">' +
              esc(p.provider) +
              "</strong>" +
              '<strong style="color:' +
              color +
              '">' +
              p.inboxPct +
              "%</strong></div>" +
              '<div class="muted" style="margin-top:4px">' +
              p.inbox +
              " inbox · " +
              p.promotions +
              " promo · " +
              p.spam +
              " spam</div></div>"
            );
          })
          .join("");

        const htCard = el("headerTelemetryCard");
        if (report.headerTelemetry) {
          const h = report.headerTelemetry;
          htCard.classList.remove("hidden");
          el("headerTelemetryBody").innerHTML =
            "<div><strong>From:</strong> " +
            esc(h.fromDomain || "—") +
            " · <strong>Return-Path:</strong> " +
            esc(h.returnPathDomain || "—") +
            " · <strong>DKIM d=:</strong> " +
            esc(h.dkimDomain || "—") +
            " (selector " +
            esc(h.dkimSelector || "—") +
            ")</div>" +
            '<div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap">' +
            '<span class="badge ' +
            (h.spfAligned ? "badge-pass" : "badge-fail") +
            '">SPF Alignment: ' +
            (h.spfAligned ? "ALIGNED" : "MISALIGNED") +
            "</span>" +
            '<span class="badge ' +
            (h.dkimAligned ? "badge-pass" : "badge-fail") +
            '">DKIM Alignment: ' +
            (h.dkimAligned ? "ALIGNED" : "MISALIGNED") +
            "</span>" +
            '<span class="badge ' +
            (h.dmarcResult === "pass" ? "badge-pass" : "badge-fail") +
            '">DMARC Result: ' +
            esc(h.dmarcResult.toUpperCase()) +
            "</span></div>";
        } else {
          htCard.classList.add("hidden");
        }

        renderSeedsTable();
        renderDiagnosticsAndRemediation(report.diagnostics, report.remediation);
        state.latestCopyAnalysis = report.copyAnalysis;
        renderLiveCopyState();
      }

      function renderHistory() {
        el("historyCount").textContent = String(state.history.length);
        const box = el("historyList");
        if (state.history.length === 0) {
          box.innerHTML = '<div class="notice">No placement tests saved yet in this workspace. Run your first test to track score improvements over time.</div>';
          return;
        }
        box.innerHTML =
          "<table><thead><tr><th>Domain</th><th>Subject</th><th>Inbox</th><th>Auth</th><th>Spam</th><th>Time</th><th>Actions</th></tr></thead><tbody>" +
          state.history
            .map(
              (item, idx) =>
                "<tr>" +
                "<td><strong>" +
                esc(item.domain) +
                "</strong></td>" +
                "<td>" +
                esc(item.subject) +
                "</td>" +
                '<td><span class="badge ' +
                (item.inboxPct >= 80 ? "badge-pass" : item.inboxPct >= 55 ? "badge-warn" : "badge-fail") +
                '">' +
                item.inboxPct +
                "%</span></td>" +
                "<td>" +
                item.authScore +
                "/100</td>" +
                "<td>" +
                item.spamScore +
                "/100</td>" +
                '<td class="muted">' +
                esc(new Date(item.createdAt).toLocaleTimeString()) +
                "</td>" +
                '<td><button type="button" class="btn btn-sm" data-open-history="' +
                idx +
                '">Open</button></td></tr>',
            )
            .join("") +
          "</tbody></table>";
      }

      function switchTab(name) {
        document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
        document.querySelectorAll(".tab-panel").forEach((p) => p.classList.toggle("active", p.id === "tab-" + name));
      }

      async function runPlacementTestFlow() {
        const btn = el("runTestBtn");
        const errBox = el("runErrorBox");
        errBox.classList.add("hidden");
        btn.disabled = true;
        btn.textContent = "Querying Live DNS & 18 Seeds...";
        try {
          const bodyPayload =
            state.mode === "eml"
              ? {
                  workspaceId,
                  rawHeaders: el("rawHeadersInput").value,
                  providerPreset: el("providerPreset").value,
                }
              : {
                  workspaceId,
                  fromEmail: el("fromEmail").value,
                  selector: el("dkimSelector").value,
                  providerPreset: el("providerPreset").value,
                  subject: el("subjectInput").value,
                  body: el("bodyInput").value,
                };

          const data = await api("/api/tests/run", {
            method: "POST",
            body: JSON.stringify(bodyPayload),
          });
          updateCreditUi(data.workspace);
          renderReport(data.report);

          const summary = {
            id: data.report.id,
            domain: data.report.domain,
            subject:
              state.mode === "eml"
                ? data.report.headerTelemetry?.subject || "(Raw .eml test)"
                : el("subjectInput").value || "(No subject)",
            inboxPct: data.report.summary.inboxPct,
            spamScore: data.report.copyAnalysis.spamScore,
            authScore: data.report.diagnostics.authScore,
            createdAt: data.report.createdAt,
            report: data.report,
          };
          state.history.unshift(summary);
          state.history = state.history.slice(0, 20);
          localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history));
          renderHistory();
          switchTab("placement");
        } catch (err) {
          errBox.textContent = err.message;
          errBox.classList.remove("hidden");
        } finally {
          btn.disabled = false;
          btn.textContent = "Run Deep Placement Test (-1 Credit)";
        }
      }

      async function runDnsOnlyCheck(goToRemediationTab) {
        const errBox = el("runErrorBox");
        errBox.classList.add("hidden");
        const btn = el("dnsOnlyBtn");
        const revBtn = el("reverifyDnsBtn");
        btn.disabled = true;
        revBtn.disabled = true;
        try {
          const data = await api("/api/diagnose/dns", {
            method: "POST",
            body: JSON.stringify({
              domainOrEmail: el("fromEmail").value,
              selector: el("dkimSelector").value,
              providerPreset: el("providerPreset").value,
            }),
          });
          state.latestDnsOnly = data;
          renderDiagnosticsAndRemediation(data.diagnostics, data.remediation);
          if (goToRemediationTab) switchTab("remediation");
          toast("Live DNS verified for " + data.diagnostics.domain);
        } catch (err) {
          errBox.textContent = err.message;
          errBox.classList.remove("hidden");
        } finally {
          btn.disabled = false;
          revBtn.disabled = false;
        }
      }

      // Wire events
      el("modeDraftBtn").onclick = () => {
        state.mode = "draft";
        el("modeDraftBtn").classList.add("active");
        el("modeEmlBtn").classList.remove("active");
        el("draftFields").classList.remove("hidden");
        el("emlFields").classList.add("hidden");
      };
      el("modeEmlBtn").onclick = () => {
        state.mode = "eml";
        el("modeEmlBtn").classList.add("active");
        el("modeDraftBtn").classList.remove("active");
        el("emlFields").classList.remove("hidden");
        el("draftFields").classList.add("hidden");
      };

      el("viewEditBtn").onclick = () => {
        state.editorView = "edit";
        el("viewEditBtn").classList.add("active");
        el("viewHighlightBtn").classList.remove("active");
        el("editBox").classList.remove("hidden");
        el("highlightBox").classList.add("hidden");
      };
      el("viewHighlightBtn").onclick = () => {
        state.editorView = "highlight";
        el("viewHighlightBtn").classList.add("active");
        el("viewEditBtn").classList.remove("active");
        el("highlightBox").classList.remove("hidden");
        el("editBox").classList.add("hidden");
        analyzeCopyNow();
      };

      el("subjectInput").addEventListener("input", scheduleAnalyze);
      el("bodyInput").addEventListener("input", scheduleAnalyze);
      el("autoRewriteBtn").onclick = runAutoRewrite;
      el("tabRewriteBtn").onclick = () => {
        runAutoRewrite();
      };
      el("applyRewriteBtn").onclick = applyRewriteToEditor;
      el("dismissRewriteBtn").onclick = () => el("inlineRewriteBanner").classList.add("hidden");
      el("tabApplyAndRetestBtn").onclick = () => {
        applyRewriteToEditor();
        runPlacementTestFlow();
      };

      el("runTestBtn").onclick = runPlacementTestFlow;
      el("dnsOnlyBtn").onclick = () => runDnsOnlyCheck(true);
      el("reverifyDnsBtn").onclick = () => runDnsOnlyCheck(false);
      el("jumpPricingBtn").onclick = () => switchTab("pricing");

      el("resetCreditsBtn").onclick = async () => {
        const data = await api("/api/workspace/reset-sandbox", {
          method: "POST",
          body: JSON.stringify({ workspaceId }),
        });
        updateCreditUi(data.workspace);
        toast("Workspace credits reset to 20/20");
      };

      document.querySelectorAll("[data-switch-plan]").forEach((btn) => {
        btn.onclick = async () => {
          const data = await api("/api/workspace/plan", {
            method: "POST",
            body: JSON.stringify({ workspaceId, planId: btn.dataset.switchPlan }),
          });
          updateCreditUi(data.workspace);
          toast("Switched to " + data.workspace.plan.name + " plan");
        };
      });

      document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.onclick = () => switchTab(btn.dataset.tab);
      });

      document.querySelectorAll("#registrarSwitcher .seg-btn").forEach((btn) => {
        btn.onclick = () => {
          state.registrar = btn.dataset.registrar;
          document.querySelectorAll("#registrarSwitcher .seg-btn").forEach((b) => b.classList.toggle("active", b === btn));
          if (state.latestReport) {
            renderDiagnosticsAndRemediation(state.latestReport.diagnostics, state.latestReport.remediation);
          } else if (state.latestDnsOnly) {
            renderDiagnosticsAndRemediation(state.latestDnsOnly.diagnostics, state.latestDnsOnly.remediation);
          }
        };
      });

      document.querySelectorAll("[data-seed-filter]").forEach((btn) => {
        btn.onclick = () => {
          state.seedFilter = btn.dataset.seedFilter;
          document.querySelectorAll("[data-seed-filter]").forEach((b) => b.classList.toggle("active", b === btn));
          renderSeedsTable();
        };
      });

      document.body.addEventListener("click", (e) => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;

        if (target.dataset.copy !== undefined) {
          copyText(target.dataset.copy);
          return;
        }
        if (target.dataset.replaceKind) {
          replaceSpan(
            target.dataset.replaceKind,
            Number(target.dataset.replaceStart),
            Number(target.dataset.replaceEnd),
            target.dataset.replaceVal || "",
          );
          return;
        }
        if (target.dataset.openHistory !== undefined) {
          const item = state.history[Number(target.dataset.openHistory)];
          if (item && item.report) {
            renderReport(item.report);
            switchTab("placement");
          }
          return;
        }
        if (target.dataset.kind && target.dataset.idx !== undefined && state.latestCopyAnalysis) {
          const list =
            target.dataset.kind === "subject"
              ? state.latestCopyAnalysis.subjectTriggers
              : state.latestCopyAnalysis.bodyTriggers;
          const tr = list[Number(target.dataset.idx)];
          if (!tr) return;
          const pop = el("triggerPopover");
          pop.classList.remove("hidden");
          pop.innerHTML =
            '<div><strong>Flagged: "' +
            esc(tr.text) +
            '"</strong> (' +
            esc(tr.category) +
            ')</div><div style="margin:4px 0;color:var(--ink-secondary)">' +
            esc(tr.reason) +
            "</div><div>" +
            tr.suggestions
              .map(
                (s) =>
                  '<button type="button" class="suggestion-pill" data-replace-kind="' +
                  target.dataset.kind +
                  '" data-replace-start="' +
                  tr.start +
                  '" data-replace-end="' +
                  tr.end +
                  '" data-replace-val="' +
                  esc(s) +
                  '">' +
                  esc(s) +
                  "</button>",
              )
              .join("") +
            "</div>";
        }
      });

      document.querySelectorAll("[data-preset]").forEach((btn) => {
        btn.onclick = () => {
          const p = btn.dataset.preset;
          el("modeDraftBtn").click();
          if (p === "healthy-live") {
            el("fromEmail").value = "alex@resend.com";
            el("dkimSelector").value = "";
            el("providerPreset").value = "resend";
            el("subjectInput").value = "Quick question on outbound setup at {{company}}";
            el("bodyInput").value =
              "Hi {{first_name}},\\n\\nNoticed your team is scaling cold outbound this quarter. How are you tracking DMARC alignment before adding new inboxes?\\n\\nBest,\\nAlex";
          } else if (p === "broken-cold") {
            el("fromEmail").value = "sales@cold-outreach-broken.invalid";
            el("dkimSelector").value = "s1";
            el("providerPreset").value = "google-workspace";
            el("subjectInput").value = "URGENT: 100% FREE guaranteed ROI demo!!!";
            el("bodyInput").value =
              "Hi {{first_name}},\\n\\nAct now for a risk-free limited time offer to double your revenue. Click here: https://bit.ly/demo-now\\n\\nBest,\\nAlex";
          } else if (p === "promo-copy") {
            el("fromEmail").value = "founder@resend.com";
            el("dkimSelector").value = "";
            el("providerPreset").value = "google-workspace";
            el("subjectInput").value = "ACT NOW: Guaranteed ROI & Free Trial!!!";
            el("bodyInput").value =
              "Hi {{first_name}},\\n\\nClaim your 100% free audit today and double your sales risk-free! Click here: https://bit.ly/audit-1\\n\\nThanks,\\nSam";
          } else if (p === "raw-headers") {
            el("modeEmlBtn").click();
            el("fromEmail").value = "alex@acme-outreach.invalid";
            el("rawHeadersInput").value = [
              "From: Alex <alex@acme-outreach.invalid>",
              "Return-Path: <bounces@shared-relay.net>",
              "DKIM-Signature: v=1; a=rsa-sha256; d=shared-relay.net; s=s1; bh=xyz;",
              "Authentication-Results: mx.google.com; dkim=pass header.i=@shared-relay.net header.s=s1; spf=pass smtp.mailfrom=shared-relay.net; dmarc=fail (p=NONE) header.from=acme-outreach.invalid",
              "Subject: URGENT: Guaranteed ROI demo!!!",
              "",
              "Act now for a 100% free trial to double your revenue!",
            ].join("\\n");
          }
          analyzeCopyNow();
          runPlacementTestFlow();
        };
      });

      // Initial hydration
      loadWorkspace();
      analyzeCopyNow();
    })();
  </script>
</body>
</html>`;
}
