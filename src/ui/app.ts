export function renderAppHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#f8fafc" />
  <meta
    name="description"
    content="InboxProof — Check why your emails might hit spam and get simple copy-paste SPF, DKIM, and DMARC fixes. 100% Free Forever ($0/mo)."
  />
  <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
  <title>InboxProof — Free Email Deliverability Checker &amp; Simple DNS Fixes ($0/mo Forever)</title>
  <style>
    :root {
      --bg: #f8fafc;
      --surface: #ffffff;
      --surface-subtle: #f1f5f9;
      --border: #e2e8f0;
      --border-strong: #cbd5e1;
      --ink: #0f172a;
      --ink-secondary: #475569;
      --ink-muted: #64748b;
      --accent: #0369a1;
      --accent-hover: #075985;
      --accent-soft: #e0f2fe;
      --pass: #047857;
      --pass-soft: #ecfdf5;
      --pass-border: #a7f3d0;
      --warn: #b45309;
      --warn-soft: #fffbeb;
      --warn-border: #fde68a;
      --fail: #be123c;
      --fail-soft: #fff1f2;
      --fail-border: #fecdd3;
      --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      --sans: "Inter", "Segoe UI", ui-sans-serif, system-ui, -apple-system, sans-serif;
      --radius: 14px;
      --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.04);
      --shadow-md: 0 8px 24px rgba(15, 23, 42, 0.06);
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: var(--sans);
      font-size: 15px;
      background: var(--bg);
      color: var(--ink);
      line-height: 1.55;
      -webkit-font-smoothing: antialiased;
    }

    button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible, summary:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
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
      max-width: 900px;
      margin: 0 auto;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-icon {
      width: 32px;
      height: 32px;
      border-radius: 9px;
      background: linear-gradient(135deg, #0369a1, #0f766e);
      color: #fff;
      display: grid;
      place-items: center;
      font-weight: 800;
      font-size: 14px;
    }
    .brand-name {
      font-weight: 750;
      font-size: 16px;
      letter-spacing: -0.02em;
      color: var(--ink);
    }
    .free-tag {
      font-size: 12px;
      font-weight: 600;
      color: var(--pass);
      background: var(--pass-soft);
      border: 1px solid var(--pass-border);
      padding: 2px 9px;
      border-radius: 999px;
    }

    .nav-tabs {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: var(--surface-subtle);
      padding: 4px;
      border-radius: 10px;
      border: 1px solid var(--border);
    }
    .nav-tab {
      appearance: none;
      border: none;
      background: transparent;
      color: var(--ink-secondary);
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 7px;
      cursor: pointer;
      transition: background-color 0.15s ease, color 0.15s ease;
    }
    .nav-tab:hover { color: var(--ink); }
    .nav-tab.active {
      background: var(--surface);
      color: var(--ink);
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 32px 20px 64px;
    }

    .view-panel { display: none; }
    .view-panel.active { display: block; }

    .hero {
      margin-bottom: 24px;
    }
    .hero h1 {
      margin: 0 0 10px;
      font-size: 30px;
      line-height: 1.2;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: var(--ink);
    }
    .hero p {
      margin: 0;
      font-size: 16px;
      color: var(--ink-secondary);
      max-width: 660px;
    }

    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow-sm);
      padding: 22px;
      margin-bottom: 18px;
    }

    .domain-form-row {
      display: flex;
      gap: 10px;
      align-items: stretch;
    }
    @media (max-width: 640px) {
      .hero h1 { font-size: 24px; }
      .domain-form-row { flex-direction: column; }
      .dns-kv { grid-template-columns: minmax(0, 1fr); }
    }

    .field { margin-bottom: 14px; }
    .field:last-child { margin-bottom: 0; }
    .field-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 12px;
    }
    @media (max-width: 640px) {
      .field-row { grid-template-columns: minmax(0, 1fr); }
    }
    label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      font-weight: 600;
      color: var(--ink);
      margin-bottom: 6px;
    }
    input[type="text"], select, textarea {
      width: 100%;
      font-family: inherit;
      font-size: 15px;
      padding: 11px 13px;
      border: 1px solid var(--border-strong);
      border-radius: 10px;
      background: #fff;
      color: var(--ink);
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    input[type="text"]:focus, select:focus, textarea:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(3, 105, 161, 0.14);
    }
    textarea { resize: vertical; min-height: 150px; line-height: 1.55; font-size: 14px; }
    textarea.mono { font-family: var(--mono); font-size: 12.5px; min-height: 190px; }

    .btn {
      appearance: none;
      border: 1px solid var(--border-strong);
      background: var(--surface);
      color: var(--ink);
      font-family: inherit;
      font-size: 14px;
      font-weight: 600;
      padding: 10px 16px;
      border-radius: 10px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      white-space: nowrap;
      transition: background-color 0.15s ease, border-color 0.15s ease;
    }
    .btn:hover { background: var(--surface-subtle); border-color: #94a3b8; }
    .btn:disabled { opacity: 0.55; cursor: not-allowed; }
    .btn-primary {
      background: var(--accent);
      border-color: var(--accent);
      color: #fff;
      padding: 11px 22px;
      box-shadow: 0 2px 8px rgba(3, 105, 161, 0.22);
    }
    .btn-primary:hover { background: var(--accent-hover); border-color: var(--accent-hover); }
    .btn-success {
      background: var(--pass);
      border-color: var(--pass);
      color: #fff;
    }
    .btn-success:hover { background: #065f46; }
    .btn-sm { padding: 6px 11px; font-size: 12.5px; border-radius: 8px; }

    .helper-row {
      margin-top: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
      font-size: 13px;
      color: var(--ink-muted);
    }
    .link-btn {
      appearance: none;
      border: none;
      background: none;
      padding: 0;
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      color: var(--accent);
      cursor: pointer;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .link-btn:hover { color: var(--accent-hover); }

    details.soft-details {
      margin-top: 14px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--surface-subtle);
      padding: 10px 14px;
    }
    details.soft-details summary {
      cursor: pointer;
      font-size: 13.5px;
      font-weight: 600;
      color: var(--ink-secondary);
      list-style: none;
    }
    details.soft-details[open] summary { margin-bottom: 12px; }

    .summary-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      padding: 20px 22px;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background: var(--surface);
      box-shadow: var(--shadow-sm);
      margin-bottom: 18px;
    }
    .summary-banner.pass { border-left: 5px solid var(--pass); }
    .summary-banner.warn { border-left: 5px solid var(--warn); }
    .summary-banner.fail { border-left: 5px solid var(--fail); }

    .score-ring {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.03em;
      font-variant-numeric: tabular-nums;
    }

    .registrar-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 14px;
    }
    .seg-control {
      display: inline-flex;
      background: var(--surface-subtle);
      padding: 3px;
      border-radius: 9px;
      border: 1px solid var(--border);
      flex-wrap: wrap;
    }
    .seg-btn {
      border: none;
      background: transparent;
      padding: 6px 12px;
      border-radius: 6px;
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      color: var(--ink-secondary);
      cursor: pointer;
    }
    .seg-btn.active {
      background: var(--surface);
      color: var(--ink);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
    }

    .check-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 18px 20px;
      margin-bottom: 14px;
      box-shadow: var(--shadow-sm);
    }
    .check-card.status-pass { border-left: 4px solid var(--pass); }
    .check-card.status-warn { border-left: 4px solid var(--warn); }
    .check-card.status-fail { border-left: 4px solid var(--fail); }

    .check-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .check-title {
      font-size: 16px;
      font-weight: 750;
      color: var(--ink);
      margin: 0;
    }
    .check-subtitle {
      font-size: 13.5px;
      color: var(--ink-secondary);
      margin-top: 2px;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 12.5px;
      font-weight: 700;
      white-space: nowrap;
    }
    .pill-pass { background: var(--pass-soft); color: var(--pass); border: 1px solid var(--pass-border); }
    .pill-warn { background: var(--warn-soft); color: var(--warn); border: 1px solid var(--warn-border); }
    .pill-fail { background: var(--fail-soft); color: var(--fail); border: 1px solid var(--fail-border); }
    .pill-info { background: var(--accent-soft); color: var(--accent); border: 1px solid #bae6fd; }

    .check-why {
      margin: 10px 0 0;
      font-size: 14px;
      color: var(--ink-secondary);
    }
    .fix-steps {
      margin: 10px 0 12px;
      padding-left: 20px;
      font-size: 13.5px;
      color: var(--ink-secondary);
    }
    .fix-steps li { margin-bottom: 4px; }

    .dns-record-box {
      margin-top: 12px;
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
      background: #f8fafc;
    }
    .dns-kv {
      display: grid;
      grid-template-columns: 115px minmax(0, 1fr) auto;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      border-bottom: 1px solid var(--border);
      font-size: 13px;
    }
    .dns-kv:last-child { border-bottom: none; }
    .dns-k { font-weight: 650; color: var(--ink-muted); font-size: 12.5px; }
    .dns-v {
      font-family: var(--mono);
      font-size: 12.5px;
      word-break: break-all;
      color: var(--ink);
    }

    .stacked-bar {
      height: 14px;
      border-radius: 999px;
      overflow: hidden;
      display: flex;
      background: var(--surface-subtle);
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
    @media (max-width: 680px) {
      .provider-grid { grid-template-columns: 1fr 1fr; }
    }
    .provider-card {
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px 12px;
      background: #fff;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      background: #fff;
    }
    th, td {
      text-align: left;
      padding: 9px 10px;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
    }
    th {
      font-size: 12px;
      font-weight: 650;
      color: var(--ink-muted);
      background: var(--surface-subtle);
    }

    .editor-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
      margin: 12px 0 10px;
      padding: 8px 10px;
      background: var(--surface-subtle);
      border: 1px solid var(--border);
      border-radius: 10px;
    }
    .highlight-surface {
      border: 1px solid var(--border-strong);
      border-radius: 10px;
      padding: 12px;
      font-size: 14px;
      line-height: 1.65;
      background: #fff;
      white-space: pre-wrap;
      min-height: 140px;
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
      margin-top: 10px;
      padding: 12px 14px;
      border-radius: 10px;
      border: 1px solid #bae6fd;
      background: #f0f9ff;
      font-size: 13px;
    }
    .suggestion-pill {
      display: inline-block;
      margin: 5px 6px 0 0;
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid var(--accent);
      background: #fff;
      color: var(--accent);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .suggestion-pill:hover { background: var(--accent); color: #fff; }

    .diff-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      padding: 12px;
      border: 1px solid var(--border);
      border-radius: 10px;
      margin-bottom: 10px;
      background: #fff;
    }
    @media (max-width: 680px) { .diff-row { grid-template-columns: 1fr; } }
    .diff-before {
      background: var(--fail-soft);
      border: 1px solid var(--fail-border);
      border-radius: 8px;
      padding: 9px 11px;
      font-size: 13px;
    }
    .diff-after {
      background: var(--pass-soft);
      border: 1px solid var(--pass-border);
      border-radius: 8px;
      padding: 9px 11px;
      font-size: 13px;
    }

    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }
    @media (max-width: 680px) { .pricing-grid { grid-template-columns: 1fr; } }
    .price-card {
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 18px;
      background: #fff;
    }
    .price-card.featured {
      border: 2px solid var(--pass);
      background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 38%);
    }

    .notice {
      padding: 12px 14px;
      border-radius: 10px;
      font-size: 13.5px;
      background: var(--surface-subtle);
      border: 1px solid var(--border);
      color: var(--ink-secondary);
    }
    .error-banner {
      margin-top: 12px;
      padding: 12px 14px;
      border-radius: 10px;
      font-size: 13.5px;
      background: var(--fail-soft);
      border: 1px solid var(--fail-border);
      color: var(--fail);
    }
    .toast {
      position: fixed;
      right: 20px;
      bottom: 20px;
      background: #0f172a;
      color: #fff;
      padding: 10px 16px;
      border-radius: 10px;
      font-size: 13.5px;
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
    .muted { color: var(--ink-muted); font-size: 13px; }
    .section-heading {
      font-size: 18px;
      font-weight: 750;
      margin: 0 0 6px;
      color: var(--ink);
    }
    .footer-note {
      margin-top: 28px;
      text-align: center;
      font-size: 13px;
      color: var(--ink-muted);
    }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="topbar-inner">
      <div class="brand">
        <div class="brand-icon">IP</div>
        <span class="brand-name">InboxProof</span>
        <span class="free-tag" id="planBadge">Free Forever (\$0/mo)</span>
      </div>

      <nav class="nav-tabs" aria-label="Primary tools">
        <button class="nav-tab active" type="button" data-view="domain">Domain Check</button>
        <button class="nav-tab" type="button" data-view="copy">Email Copy Checker</button>
        <button class="nav-tab" type="button" data-view="more">More Tools (<span id="historyCount">0</span>)</button>
      </nav>
    </div>
  </header>

  <main class="container">
    <!-- PRIMARY VIEW: SIMPLE DOMAIN CHECK & PLAIN-ENGLISH FIXES -->
    <section class="view-panel active" id="view-domain">
      <div class="hero">
        <h1>Check why your emails might hit spam — and get simple copy-paste fixes.</h1>
        <p>Enter your sending email or domain below. We run live checks and explain SPF, DKIM, and DMARC in plain English. 100% free forever — unlimited checks, no credit card.</p>
      </div>

      <div class="card">
        <label for="fromEmail">Your sending email address or website domain</label>
        <div class="domain-form-row">
          <input
            id="fromEmail"
            type="text"
            value="alex@resend.com"
            placeholder="e.g. you@yourcompany.com or yourcompany.com"
            autocomplete="off"
          />
          <button class="btn btn-primary" type="button" id="runTestBtn">Check my domain</button>
        </div>

        <div class="helper-row">
          <div>
            Try an example:
            <button class="link-btn" type="button" data-preset="healthy-live">Healthy domain (resend.com)</button>
            ·
            <button class="link-btn" type="button" data-preset="broken-cold">Domain with missing setup</button>
          </div>
          <span id="creditsText" class="muted">Unlimited checks · 0 run</span>
        </div>

        <details class="soft-details">
          <summary>Optional settings (email provider &amp; DKIM selector)</summary>
          <div class="field-row">
            <div class="field">
              <label for="providerPreset">Where do you send email from?</label>
              <select id="providerPreset">
                <option value="google-workspace">Google Workspace</option>
                <option value="microsoft-365">Microsoft 365</option>
                <option value="resend">Resend / Amazon SES</option>
                <option value="postmark">Postmark</option>
                <option value="zoho">Zoho Mail</option>
                <option value="custom-smtp">Other / Custom SMTP</option>
              </select>
            </div>
            <div class="field">
              <label for="dkimSelector">DKIM selector <span class="muted">(leave blank to auto-detect)</span></label>
              <input id="dkimSelector" type="text" placeholder="Auto-detect (google, s1, selector1...)" />
            </div>
          </div>
        </details>

        <div id="runErrorBox" class="error-banner hidden"></div>
      </div>

      <!-- RIGHT: RESULTS WORKBENCH -->
      <div id="resultsEmpty" class="card">
        <h2 class="section-heading">What we check for you in 3 seconds</h2>
        <p class="muted" style="margin:0 0 14px">You don't need to know any email jargon. After you click <strong>Check my domain</strong>, you'll get a clear pass/fix card for each of these:</p>
        <div style="display:grid;gap:10px">
          <div class="notice"><strong>SPF</strong> — Proves you sent the email. Tells Gmail and Outlook which mail servers are allowed to send for your domain.</div>
          <div class="notice"><strong>DKIM</strong> — Tamper-proof seal. Adds an invisible digital signature so inboxes know your email wasn't altered in transit.</div>
          <div class="notice"><strong>DMARC</strong> — Tells inboxes how to handle fakes. Required by Gmail and Yahoo to keep impersonators off your domain.</div>
          <div class="notice"><strong>Reply Inbox (MX)</strong> — Lets people reply to your emails. Inboxes distrust domains that can't receive replies.</div>
        </div>
      </div>

      <div id="resultsArea" class="hidden">
        <div id="summaryBanner" class="summary-banner pass">
          <div>
            <div style="font-size:13px;color:var(--ink-muted)" id="summaryDomainLine">domain.com</div>
            <div class="score-ring" id="summaryHeadline">Checking...</div>
            <div style="font-size:14px;color:var(--ink-secondary);margin-top:2px" id="summarySubline"></div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-sm" type="button" id="reverifyDnsBtn">Re-check live DNS</button>
          </div>
        </div>

        <div class="registrar-bar" id="registrarBar">
          <div>
            <strong style="font-size:14px">Where is your domain hosted?</strong>
            <span class="muted" style="margin-left:6px">Pick yours for exact copy-paste values</span>
          </div>
          <div class="seg-control" id="registrarSwitcher">
            <button class="seg-btn active" type="button" data-registrar="cloudflare">Cloudflare</button>
            <button class="seg-btn" type="button" data-registrar="godaddy">GoDaddy</button>
            <button class="seg-btn" type="button" data-registrar="namecheap">Namecheap</button>
            <button class="seg-btn" type="button" data-registrar="route53">Route 53</button>
          </div>
        </div>

        <div id="spfFlattenerNotice" class="popover-box hidden" style="margin-bottom:14px"></div>
        <div id="plainEnglishChecks"></div>

        <div id="headerTelemetryCard" class="check-card hidden">
          <strong style="font-size:15px">Raw email header alignment</strong>
          <div id="headerTelemetryBody" style="margin-top:8px;font-size:13.5px"></div>
        </div>

        <!-- COLLAPSIBLE ADVANCED DETAILS -->
        <details class="soft-details" id="placementDetails" style="background:#fff">
          <summary id="placementSummaryToggle">See 18-inbox placement breakdown (Gmail, Outlook, Yahoo &amp; more)</summary>
          <div id="placementEmpty" class="notice">Run a domain check above to see estimated placement across 18 inbox providers.</div>
          <div id="placementContent" class="hidden">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-top:4px">
              <strong id="reportDomainHeader">domain.com</strong>
              <div style="display:flex;gap:10px;font-size:13px;font-weight:700">
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

            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px">
              <strong style="font-size:13.5px">Inbox-by-inbox breakdown (18 nodes)</strong>
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
                    <th>Mailbox</th>
                    <th>Provider</th>
                    <th>Region</th>
                    <th>Folder</th>
                    <th>Why</th>
                  </tr>
                </thead>
                <tbody id="seedsTableBody"></tbody>
              </table>
            </div>
          </div>
        </details>

        <details class="soft-details" style="background:#fff">
          <summary>Technical raw DNS records (optional)</summary>
          <pre id="rawDnsPre" style="margin:8px 0 0;padding:12px;background:#0f172a;color:#e2e8f0;border-radius:8px;font-size:12px;overflow:auto"></pre>
        </details>
      </div>
    </section>

    <!-- SECONDARY VIEW: EMAIL COPY SPAM CHECKER & REWRITER -->
    <section class="view-panel" id="view-copy">
      <div class="hero">
        <h2 class="section-heading" style="font-size:24px">Email Copy Spam Checker</h2>
        <p>Paste your subject line and message below to highlight words that trigger spam filters — then rewrite them into natural, human copy in one click.</p>
      </div>

      <div class="card">
        <div class="field">
          <label for="subjectInput">
            <span>Subject line</span>
            <span id="liveSpamBadge" class="status-pill pill-pass">Spam risk: 0/100</span>
          </label>
          <input id="subjectInput" type="text" value="Quick question on Q4 outbound at {{company}}" />
        </div>

        <div class="editor-toolbar">
          <div class="seg-control">
            <button class="seg-btn active" type="button" id="viewEditBtn">Edit text</button>
            <button class="seg-btn" type="button" id="viewHighlightBtn">Highlight risky words (<span id="triggerCount">0</span>)</button>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-sm" type="button" data-preset="promo-copy">Load spammy example</button>
            <button class="btn btn-sm btn-success" type="button" id="autoRewriteBtn">Auto-rewrite risky copy</button>
          </div>
        </div>

        <div id="editBox">
          <textarea id="bodyInput" placeholder="Write or paste your email draft...">Hi {{first_name}},

Noticed your team is hiring two new SDRs this quarter. How are you validating domain health before ramping daily send volume?

Happy to share a short 2-minute breakdown if helpful.

Best,
Alex</textarea>
        </div>

        <div id="highlightBox" class="hidden">
          <div class="muted" style="margin-bottom:4px">Subject line (click any highlighted word for safer alternatives):</div>
          <div id="subjectHighlightView" class="highlight-surface" style="min-height:auto;margin-bottom:10px"></div>
          <div class="muted" style="margin-bottom:4px">Email body:</div>
          <div id="bodyHighlightView" class="highlight-surface"></div>
          <div id="triggerPopover" class="popover-box hidden"></div>
        </div>

        <div id="inlineRewriteBanner" class="popover-box hidden">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">
            <strong id="rewriteBannerTitle">Cleaner version ready</strong>
            <div style="display:flex;gap:6px">
              <button class="btn btn-sm btn-primary" type="button" id="applyRewriteBtn">Apply clean copy</button>
              <button class="btn btn-sm" type="button" id="tabApplyAndRetestBtn">Apply &amp; run domain check</button>
              <button class="btn btn-sm" type="button" id="dismissRewriteBtn">Dismiss</button>
            </div>
          </div>
          <div id="rewriteBannerPreview" class="muted"></div>
        </div>
      </div>

      <div class="card">
        <div id="rewriterSummaryStrip" class="notice" style="margin-bottom:14px">
          Live check is active. Edit your email above or click <strong>Auto-rewrite risky copy</strong> to see side-by-side improvements.
        </div>
        <div id="triggerBreakdownList" style="margin-bottom:14px"></div>
        <div id="sentenceDiffContainer"></div>
      </div>
    </section>

    <!-- SECONDARY VIEW: MORE TOOLS (HISTORY, RAW .EML, FREE VS PAID) -->
    <section class="view-panel" id="view-more">
      <div class="hero">
        <h2 class="section-heading" style="font-size:24px">More Tools</h2>
        <p>Review past checks, inspect raw email headers (.eml), or see how InboxProof compares to paid deliverability tools.</p>
      </div>

      <div class="card">
        <h3 class="section-heading">Recent checks</h3>
        <p class="muted" style="margin:0 0 12px">Click Open on any past check to reload its full report.</p>
        <div id="historyList"></div>
      </div>

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px">
          <div>
            <h3 class="section-heading" style="margin:0">Check raw email headers (.eml)</h3>
            <div class="muted">Paste "Show original" email headers from Gmail or Outlook to check SPF/DKIM alignment.</div>
          </div>
          <button class="btn btn-sm" type="button" data-preset="raw-headers">Load sample headers</button>
        </div>
        <div class="field">
          <label for="rawHeadersInput">Raw email source / SMTP headers</label>
          <textarea id="rawHeadersInput" class="mono" placeholder="From: Alex <alex@acme.io>&#10;Return-Path: <bounce@relay.net>&#10;DKIM-Signature: v=1; d=relay.net; s=s1; ...&#10;Authentication-Results: ..."></textarea>
        </div>
        <button class="btn btn-primary" type="button" id="runEmlTestBtn">Analyze raw headers</button>
      </div>

      <div class="card">
        <h3 class="section-heading">100% Free Forever vs Paid Tools</h3>
        <p class="muted" style="margin:0 0 16px">Traditional deliverability tools charge \$85–\$185/month and bury fixes behind cryptic RFC errors. InboxProof is \$0/mo forever — saving you 100% with every feature unlocked.</p>
        <div class="pricing-grid">
          <div class="price-card featured">
            <span class="status-pill pill-pass">Active · 100% Free Forever</span>
            <h4 style="margin:10px 0 4px;font-size:17px">InboxProof</h4>
            <div style="font-size:30px;font-weight:800;color:var(--pass)">\$0<span class="muted">/mo forever</span></div>
            <ul class="fix-steps" style="margin-top:12px">
              <li><strong>Unlimited</strong> domain &amp; 18-inbox placement checks</li>
              <li>Plain-English SPF, DKIM, DMARC &amp; MX explanations</li>
              <li>1-click copy-paste fixes for Cloudflare, GoDaddy, Namecheap &amp; Route 53</li>
              <li>Unlimited email copy spam checks &amp; rewrites</li>
              <li>No credit card, no trial limits, no paywalls</li>
            </ul>
          </div>
          <div class="price-card" style="background:var(--surface-subtle)">
            <span class="status-pill pill-fail">Paid Competitors</span>
            <h4 style="margin:10px 0 4px;font-size:17px">GlockApps / MailReach</h4>
            <div style="font-size:30px;font-weight:800;color:var(--ink-muted)">\$85–\$185<span class="muted">/mo</span></div>
            <ul class="fix-steps" style="margin-top:12px;color:var(--ink-muted)">
              <li>Strict monthly credit limits on entry plans</li>
              <li>Technical errors like "DKIM alignment failed on selector s1"</li>
              <li>No registrar-specific GoDaddy/Cloudflare host formatting</li>
              <li>No built-in spam copy rewriter</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <footer class="footer-note">
      InboxProof is 100% Free &amp; Unlimited Forever (\$0/mo) — Live DNS checks with plain-English fixes.
    </footer>
  </main>

  <div id="toast" class="toast" role="status" aria-live="polite">Copied to clipboard</div>

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
        view: "domain",
        editorView: "edit",
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

      let toastTimer = null;
      function toast(msg) {
        const t = el("toast");
        t.textContent = msg;
        t.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove("show"), 2000);
      }

      async function copyText(text) {
        try {
          await navigator.clipboard.writeText(text);
          toast("Copied to clipboard");
        } catch {
          toast("Copy failed — select and copy manually");
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

      function switchView(name) {
        state.view = name;
        document.querySelectorAll(".nav-tab").forEach((b) => b.classList.toggle("active", b.dataset.view === name));
        document.querySelectorAll(".view-panel").forEach((p) => p.classList.toggle("active", p.id === "view-" + name));
      }

      function updateWorkspaceUi(ws) {
        if (!ws) return;
        const testsRun = typeof ws.testsRun === "number" ? ws.testsRun : Number(ws.creditsUsed || 0);
        el("planBadge").textContent = ws.plan.name + " ($0/mo)";
        el("creditsText").textContent = "Unlimited checks · " + testsRun + " run";
      }

      async function loadWorkspace() {
        try {
          const data = await api("/api/workspace?workspaceId=" + encodeURIComponent(workspaceId));
          updateWorkspaceUi(data.workspace);
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
        badge.textContent = "Spam risk: " + a.spamScore + "/100";
        badge.className = "status-pill " + (a.spamScore >= 50 ? "pill-fail" : a.spamScore >= 20 ? "pill-warn" : "pill-pass");

        const totalTriggers = a.subjectTriggers.length + a.bodyTriggers.length;
        el("triggerCount").textContent = String(totalTriggers);

        el("subjectHighlightView").innerHTML = renderHighlightedText(el("subjectInput").value, a.subjectTriggers, "subject");
        el("bodyHighlightView").innerHTML = renderHighlightedText(el("bodyInput").value, a.bodyTriggers, "body");

        const breakdown = el("triggerBreakdownList");
        if (totalTriggers === 0) {
          breakdown.innerHTML = '<div class="status-pill pill-pass">No spam-trigger phrases found — your message reads naturally.</div>';
        } else {
          const all = [
            ...a.subjectTriggers.map((t, i) => ({ ...t, loc: "Subject", kind: "subject", idx: i })),
            ...a.bodyTriggers.map((t, i) => ({ ...t, loc: "Body", kind: "body", idx: i })),
          ];
          breakdown.innerHTML =
            '<div style="font-size:14px;font-weight:700;margin-bottom:10px">Risky words found (' + all.length + ")</div>" +
            all
              .map(
                (t) =>
                  '<div class="check-card ' +
                  (t.severity === "critical" ? "status-fail" : "status-warn") +
                  '" style="padding:12px 14px;margin-bottom:10px">' +
                  '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">' +
                  '<div><strong>"' +
                  esc(t.text) +
                  '"</strong> <span class="muted">in ' +
                  esc(t.loc) +
                  "</span></div>" +
                  '<span class="muted">+' +
                  t.points +
                  " risk</span></div>" +
                  '<div style="font-size:13px;color:var(--ink-secondary);margin-top:4px">' +
                  esc(t.reason) +
                  "</div>" +
                  '<div style="margin-top:6px">' +
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
                        '">Use "' +
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
        toast("Replaced risky phrase");
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
            "Spam risk dropped from " +
            data.beforeAnalysis.spamScore +
            " to " +
            data.afterAnalysis.spamScore +
            " (+" +
            data.projectedInboxLiftPct +
            "% est. inbox lift)";
          el("rewriteBannerPreview").innerHTML =
            "<div><strong>New subject:</strong> " +
            esc(data.rewrittenSubject) +
            "</div>" +
            '<div style="margin-top:4px;white-space:pre-wrap"><strong>New body preview:</strong> ' +
            esc(data.rewrittenBody.slice(0, 220)) +
            (data.rewrittenBody.length > 220 ? "..." : "") +
            "</div>";

          el("rewriterSummaryStrip").innerHTML =
            "<strong>Rewrite ready:</strong> Spam risk dropped from <strong>" +
            data.beforeAnalysis.spamScore +
            "</strong> to <strong>" +
            data.afterAnalysis.spamScore +
            "</strong> (+" +
            data.projectedInboxLiftPct +
            "% estimated inbox lift).";

          const diffBox = el("sentenceDiffContainer");
          if (data.sentenceDiffs.length === 0) {
            diffBox.innerHTML = '<div class="notice">Your draft already looks clean — no sentences needed rewriting.</div>';
          } else {
            diffBox.innerHTML =
              '<div style="font-size:14px;font-weight:700;margin-bottom:10px">Before vs. after</div>' +
              data.sentenceDiffs
                .map(
                  (d) =>
                    '<div class="diff-row">' +
                    '<div><div class="muted" style="margin-bottom:4px">Before</div><div class="diff-before">' +
                    esc(d.before) +
                    "</div></div>" +
                    '<div><div class="muted" style="margin-bottom:4px">After · ' +
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
          btn.textContent = "Auto-rewrite risky copy";
        }
      }

      function applyRewriteToEditor() {
        if (!state.latestRewrite) return;
        el("subjectInput").value = state.latestRewrite.rewrittenSubject;
        el("bodyInput").value = state.latestRewrite.rewrittenBody;
        el("inlineRewriteBanner").classList.add("hidden");
        analyzeCopyNow();
        toast("Applied clean copy");
      }

      function renderFixDetails(fix) {
        if (!fix) return "";
        const rec = fix.recordsByRegistrar[state.registrar];
        return (
          '<p class="check-why">' +
          esc(fix.plainEnglishWhy) +
          "</p>" +
          '<ol class="fix-steps">' +
          fix.howToFixSteps.map((s) => "<li>" + esc(s) + "</li>").join("") +
          "</ol>" +
          '<div class="dns-record-box">' +
          '<div class="dns-kv"><span class="dns-k">Record type</span><span class="dns-v">' +
          esc(rec.type) +
          "</span><span></span></div>" +
          '<div class="dns-kv"><span class="dns-k">Host / Name</span><span class="dns-v">' +
          esc(rec.host) +
          '</span><button type="button" class="btn btn-sm" data-copy="' +
          esc(rec.host) +
          '">Copy host</button></div>' +
          '<div class="dns-kv"><span class="dns-k">Value</span><span class="dns-v">' +
          esc(rec.value) +
          '</span><button type="button" class="btn btn-sm btn-primary" data-copy="' +
          esc(rec.value) +
          '">Copy value</button></div>' +
          '<div class="dns-kv"><span class="dns-k">TTL</span><span class="dns-v">' +
          esc(rec.ttl) +
          (rec.proxyStatus ? " · " + esc(rec.proxyStatus) : "") +
          '</span><span class="muted">' +
          esc(rec.note) +
          "</span></div></div>"
        );
      }

      function statusMeta(status) {
        if (status === "pass") return { cls: "status-pass", pill: "pill-pass", label: "Passed" };
        if (status === "warn") return { cls: "status-warn", pill: "pill-warn", label: "Recommended fix" };
        return { cls: "status-fail", pill: "pill-fail", label: "Fix needed" };
      }

      function renderDiagnosticsAndRemediation(diagnostics, remediation, reportSummary) {
        if (!diagnostics || !remediation) return;

        el("resultsEmpty").classList.add("hidden");
        el("resultsArea").classList.remove("hidden");

        const fixCount = remediation.fixes.length;
        const banner = el("summaryBanner");
        banner.className = "summary-banner " + (fixCount === 0 ? "pass" : diagnostics.authScore >= 60 ? "warn" : "fail");

        el("summaryDomainLine").textContent =
          diagnostics.domain + " · Detected provider: " + diagnostics.detectedProvider;

        if (fixCount === 0) {
          el("summaryHeadline").textContent = "All email checks passed (" + diagnostics.authScore + "/100)";
          el("summaryHeadline").style.color = "var(--pass)";
        } else {
          el("summaryHeadline").textContent =
            fixCount + (fixCount === 1 ? " simple fix needed" : " simple fixes needed") + " (Score: " + diagnostics.authScore + "/100)";
          el("summaryHeadline").style.color = diagnostics.authScore >= 60 ? "var(--warn)" : "var(--fail)";
        }

        if (reportSummary) {
          el("summarySubline").textContent =
            "Estimated inbox placement: " +
            reportSummary.inboxPct +
            "% (Grade " +
            reportSummary.grade +
            ") across 18 inbox providers.";
        } else {
          el("summarySubline").textContent =
            fixCount === 0
              ? "Your SPF, DKIM, DMARC, and reply routing look healthy."
              : "Copy the records below into your domain host, then click Re-check live DNS.";
        }

        el("registrarBar").classList.toggle("hidden", fixCount === 0);

        const flat = el("spfFlattenerNotice");
        if (remediation.spfFlattenerTip) {
          flat.textContent = remediation.spfFlattenerTip;
          flat.classList.remove("hidden");
        } else {
          flat.classList.add("hidden");
        }

        const fixByCat = {};
        remediation.fixes.forEach((f) => {
          fixByCat[f.category] = f;
        });

        const checks = [
          {
            key: "SPF",
            title: "SPF — Proves you sent the email",
            subtitle: "Lists which mail servers are allowed to send email for " + diagnostics.domain,
            status: diagnostics.spf.status,
            passText:
              "Active and valid (" + diagnostics.spf.lookupCount + " of 10 DNS lookups used). Receiving inboxes can verify your sending server.",
            fix: fixByCat.SPF,
          },
          {
            key: "DKIM",
            title: "DKIM — Tamper-proof seal",
            subtitle: "Signs each email so inboxes know nobody altered your message",
            status: diagnostics.dkim.status,
            passText:
              'Active on selector "' + diagnostics.dkim.selector + '" (' + diagnostics.dkim.estimatedBits + "-bit key). Your outgoing messages are properly signed.",
            fix: fixByCat.DKIM,
          },
          {
            key: "DMARC",
            title: "DMARC — Tells inboxes how to handle fakes",
            subtitle: "Protects your domain from impersonators (required by Gmail & Yahoo)",
            status: diagnostics.dmarc.status,
            passText:
              "Active policy (p=" + (diagnostics.dmarc.policy || "enforced") + "). Inboxes know how to verify your domain and stop spoofers.",
            fix: fixByCat.DMARC,
          },
          {
            key: "MX",
            title: "Reply Inbox (MX) — Lets people reply to your emails",
            subtitle: "Confirms your domain has a working mailbox that can receive replies",
            status: diagnostics.mx.status,
            passText:
              "Working mail server found (" + (diagnostics.mx.records[0]?.exchange || "verified") + ").",
            fix: fixByCat.MX,
          },
        ];

        el("plainEnglishChecks").innerHTML = checks
          .map((item) => {
            const m = statusMeta(item.status);
            return (
              '<article class="check-card ' +
              m.cls +
              '">' +
              '<div class="check-header">' +
              '<div><h3 class="check-title">' +
              esc(item.title) +
              '</h3><div class="check-subtitle">' +
              esc(item.subtitle) +
              "</div></div>" +
              '<span class="status-pill ' +
              m.pill +
              '">' +
              esc(m.label) +
              "</span></div>" +
              (item.fix
                ? renderFixDetails(item.fix)
                : '<p class="check-why">' + esc(item.passText) + "</p>") +
              "</article>"
            );
          })
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
            const cls = s.folder === "inbox" ? "pill-pass" : s.folder === "promotions" ? "pill-warn" : "pill-fail";
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
              '<td><span class="status-pill ' +
              cls +
              '">' +
              esc(s.folder) +
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

        el("placementSummaryToggle").textContent =
          "See 18-inbox placement breakdown (" +
          report.summary.inboxPct +
          "% inbox · " +
          report.summary.promotionsPct +
          "% promotions · " +
          report.summary.spamPct +
          "% spam)";

        el("reportDomainHeader").textContent = report.domain + " (" + report.diagnostics.detectedProvider + ")";
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
              '<strong style="font-size:13px">' +
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
            '<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">' +
            '<span class="status-pill ' +
            (h.spfAligned ? "pill-pass" : "pill-fail") +
            '">SPF alignment: ' +
            (h.spfAligned ? "Aligned" : "Misaligned") +
            "</span>" +
            '<span class="status-pill ' +
            (h.dkimAligned ? "pill-pass" : "pill-fail") +
            '">DKIM alignment: ' +
            (h.dkimAligned ? "Aligned" : "Misaligned") +
            "</span>" +
            '<span class="status-pill ' +
            (h.dmarcResult === "pass" ? "pill-pass" : "pill-fail") +
            '">DMARC result: ' +
            esc(h.dmarcResult) +
            "</span></div>";
        } else {
          htCard.classList.add("hidden");
        }

        renderSeedsTable();
        renderDiagnosticsAndRemediation(report.diagnostics, report.remediation, report.summary);
        state.latestCopyAnalysis = report.copyAnalysis;
        renderLiveCopyState();
      }

      function renderHistory() {
        el("historyCount").textContent = String(state.history.length);
        const box = el("historyList");
        if (state.history.length === 0) {
          box.innerHTML = '<div class="notice">No checks saved yet. Run your first domain check to save results here.</div>';
          return;
        }
        box.innerHTML =
          '<div style="overflow-x:auto"><table><thead><tr><th>Domain</th><th>Inbox</th><th>Auth score</th><th>Spam risk</th><th>Time</th><th>Action</th></tr></thead><tbody>' +
          state.history
            .map(
              (item, idx) =>
                "<tr>" +
                "<td><strong>" +
                esc(item.domain) +
                "</strong></td>" +
                '<td><span class="status-pill ' +
                (item.inboxPct >= 80 ? "pill-pass" : item.inboxPct >= 55 ? "pill-warn" : "pill-fail") +
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
          "</tbody></table></div>";
      }

      async function runPlacementTestFlow(useRawEml) {
        const btn = el("runTestBtn");
        const emlBtn = el("runEmlTestBtn");
        const errBox = el("runErrorBox");
        errBox.classList.add("hidden");
        btn.disabled = true;
        emlBtn.disabled = true;
        btn.textContent = "Checking live DNS...";
        try {
          const bodyPayload = useRawEml
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
          updateWorkspaceUi(data.workspace);
          renderReport(data.report);

          const summary = {
            id: data.report.id,
            domain: data.report.domain,
            subject: useRawEml
              ? data.report.headerTelemetry?.subject || "(Raw .eml check)"
              : el("subjectInput").value || "(Domain check)",
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
          switchView("domain");
        } catch (err) {
          switchView("domain");
          errBox.textContent = err.message;
          errBox.classList.remove("hidden");
        } finally {
          btn.disabled = false;
          emlBtn.disabled = false;
          btn.textContent = "Check my domain";
        }
      }

      async function runDnsOnlyCheck() {
        const errBox = el("runErrorBox");
        errBox.classList.add("hidden");
        const revBtn = el("reverifyDnsBtn");
        revBtn.disabled = true;
        revBtn.textContent = "Checking...";
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
          renderDiagnosticsAndRemediation(data.diagnostics, data.remediation, null);
          toast("Live DNS re-checked for " + data.diagnostics.domain);
        } catch (err) {
          errBox.textContent = err.message;
          errBox.classList.remove("hidden");
        } finally {
          revBtn.disabled = false;
          revBtn.textContent = "Re-check live DNS";
        }
      }

      document.querySelectorAll(".nav-tab").forEach((btn) => {
        btn.onclick = () => switchView(btn.dataset.view);
      });

      el("fromEmail").addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          runPlacementTestFlow(false);
        }
      });

      el("runTestBtn").onclick = () => runPlacementTestFlow(false);
      el("runEmlTestBtn").onclick = () => runPlacementTestFlow(true);
      el("reverifyDnsBtn").onclick = runDnsOnlyCheck;

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
      el("applyRewriteBtn").onclick = applyRewriteToEditor;
      el("dismissRewriteBtn").onclick = () => el("inlineRewriteBanner").classList.add("hidden");
      el("tabApplyAndRetestBtn").onclick = () => {
        applyRewriteToEditor();
        runPlacementTestFlow(false);
      };

      document.querySelectorAll("#registrarSwitcher .seg-btn").forEach((btn) => {
        btn.onclick = () => {
          state.registrar = btn.dataset.registrar;
          document.querySelectorAll("#registrarSwitcher .seg-btn").forEach((b) => b.classList.toggle("active", b === btn));
          if (state.latestReport) {
            renderDiagnosticsAndRemediation(
              state.latestReport.diagnostics,
              state.latestReport.remediation,
              state.latestReport.summary,
            );
          } else if (state.latestDnsOnly) {
            renderDiagnosticsAndRemediation(state.latestDnsOnly.diagnostics, state.latestDnsOnly.remediation, null);
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
            switchView("domain");
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
            '"</strong></div><div style="margin:4px 0;color:var(--ink-secondary)">' +
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
          if (p === "healthy-live") {
            el("fromEmail").value = "alex@resend.com";
            el("dkimSelector").value = "";
            el("providerPreset").value = "resend";
            el("subjectInput").value = "Quick question on outbound setup at {{company}}";
            el("bodyInput").value =
              "Hi {{first_name}},\\n\\nNoticed your team is scaling cold outbound this quarter. How are you tracking DMARC alignment before adding new inboxes?\\n\\nBest,\\nAlex";
            analyzeCopyNow();
            runPlacementTestFlow(false);
          } else if (p === "broken-cold") {
            el("fromEmail").value = "sales@cold-outreach-broken.invalid";
            el("dkimSelector").value = "s1";
            el("providerPreset").value = "google-workspace";
            el("subjectInput").value = "Quick question on Q4 outreach";
            el("bodyInput").value =
              "Hi {{first_name}},\\n\\nWould love to share a quick idea for your outbound team.\\n\\nBest,\\nAlex";
            analyzeCopyNow();
            runPlacementTestFlow(false);
          } else if (p === "promo-copy") {
            el("subjectInput").value = "ACT NOW: Guaranteed ROI & Free Trial!!!";
            el("bodyInput").value =
              "Hi {{first_name}},\\n\\nClaim your 100% free audit today and double your sales risk-free! Click here: https://bit.ly/audit-1\\n\\nThanks,\\nSam";
            el("viewHighlightBtn").click();
            analyzeCopyNow();
          } else if (p === "raw-headers") {
            el("rawHeadersInput").value = [
              "From: Alex <alex@acme-outreach.invalid>",
              "Return-Path: <bounces@shared-relay.net>",
              "DKIM-Signature: v=1; a=rsa-sha256; d=shared-relay.net; s=s1; bh=xyz;",
              "Authentication-Results: mx.google.com; dkim=pass header.i=@shared-relay.net header.s=s1; spf=pass smtp.mailfrom=shared-relay.net; dmarc=fail (p=NONE) header.from=acme-outreach.invalid",
              "Subject: URGENT: Guaranteed ROI demo!!!",
              "",
              "Act now for a 100% free trial to double your revenue!",
            ].join("\\n");
            toast("Sample headers loaded — click Analyze raw headers");
          }
        };
      });

      loadWorkspace();
      analyzeCopyNow();
    })();
  </script>
</body>
</html>`;
}
