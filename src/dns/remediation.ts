import type { DomainDiagnostics } from "./diagnostics.ts";

export type ProviderPreset =
  | "google-workspace"
  | "microsoft-365"
  | "zoho"
  | "amazon-ses"
  | "postmark"
  | "resend"
  | "custom-smtp";

export type RegistrarName = "cloudflare" | "godaddy" | "namecheap" | "route53";

export interface RegistrarRecordSpec {
  registrarLabel: string;
  type: "TXT" | "CNAME" | "MX";
  host: string;
  value: string;
  ttl: string;
  proxyStatus?: string;
  note: string;
}

export interface DnsFixCard {
  id: string;
  category: "MX" | "SPF" | "DKIM" | "DMARC";
  severity: "critical" | "warning";
  title: string;
  plainEnglishWhy: string;
  howToFixSteps: string[];
  recordsByRegistrar: Record<RegistrarName, RegistrarRecordSpec>;
}

export interface RemediationPlan {
  domain: string;
  apexDomain: string;
  subPrefix: string;
  providerPreset: ProviderPreset;
  fixes: DnsFixCard[];
  healthyChecks: string[];
  spfFlattenerTip: string | null;
}

const TWO_PART_TLDS = new Set([
  "co.uk",
  "org.uk",
  "ac.uk",
  "com.au",
  "net.au",
  "co.nz",
  "co.jp",
  "com.br",
  "co.in",
]);

function splitDomainApex(domain: string): { apexDomain: string; subPrefix: string } {
  const labels = domain.toLowerCase().split(".").filter(Boolean);
  if (labels.length <= 2) {
    return { apexDomain: domain, subPrefix: "" };
  }
  const lastTwo = `${labels[labels.length - 2]}.${labels[labels.length - 1]}`;
  const apexCount = TWO_PART_TLDS.has(lastTwo) && labels.length >= 3 ? 3 : 2;
  const apexDomain = labels.slice(-apexCount).join(".");
  const subPrefix = labels.slice(0, labels.length - apexCount).join(".");
  return { apexDomain, subPrefix };
}

function buildRegistrarHosts(subLabel: string, domain: string, apexDomain: string, subPrefix: string) {
  const fullHost = subLabel ? `${subLabel}.${domain}` : domain;
  const relativeParts = [subLabel, subPrefix].filter(Boolean);
  const relativeHost = relativeParts.length > 0 ? relativeParts.join(".") : "@";
  return { fullHost, relativeHost, apexDomain };
}

function makeRegistrarMap(
  type: "TXT" | "CNAME" | "MX",
  subLabel: string,
  value: string,
  domain: string,
  apexDomain: string,
  subPrefix: string,
  ttl = "Auto / 3600",
): Record<RegistrarName, RegistrarRecordSpec> {
  const { fullHost, relativeHost } = buildRegistrarHosts(subLabel, domain, apexDomain, subPrefix);
  const isCname = type === "CNAME";

  return {
    cloudflare: {
      registrarLabel: "Cloudflare DNS",
      type,
      host: fullHost,
      value,
      ttl: "Auto",
      proxyStatus: isCname ? "DNS Only (Grey Cloud)" : undefined,
      note: isCname
        ? "Important: Keep Proxy status OFF (Grey Cloud). Orange-clouding breaks DKIM validation."
        : "Paste the exact host and value in Cloudflare DNS -> Records -> Add record.",
    },
    godaddy: {
      registrarLabel: "GoDaddy DNS",
      type,
      host: relativeHost,
      value,
      ttl: "1 Hour",
      note: `GoDaddy automatically appends .${apexDomain}, so enter "${relativeHost}" only — never the full domain.`,
    },
    namecheap: {
      registrarLabel: "Namecheap Advanced DNS",
      type,
      host: relativeHost,
      value,
      ttl: "Automatic",
      note: `Namecheap appends .${apexDomain} automatically. Use "${relativeHost}" as Host.`,
    },
    route53: {
      registrarLabel: "AWS Route 53",
      type,
      host: fullHost,
      value: type === "TXT" ? `"${value}"` : value,
      ttl: "300",
      note: type === "TXT" ? "Route 53 expects TXT values wrapped in double quotes." : "Paste exact record target.",
    },
  };
}

function spfIncludeForProvider(provider: ProviderPreset): string {
  switch (provider) {
    case "google-workspace":
      return "include:_spf.google.com";
    case "microsoft-365":
      return "include:spf.protection.outlook.com";
    case "zoho":
      return "include:zoho.com";
    case "amazon-ses":
      return "include:amazonses.com";
    case "postmark":
      return "include:spf.mtasv.net";
    case "resend":
      return "include:amazonses.com";
    default:
      return "include:_spf.google.com";
  }
}

function dkimSpecForProvider(
  provider: ProviderPreset,
  selector: string,
  domain: string,
): { type: "TXT" | "CNAME"; subLabel: string; value: string; steps: string[] } {
  if (provider === "microsoft-365") {
    const dashed = domain.replace(/\./g, "-");
    const sel = selector === "s1" || selector === "google" ? "selector1" : selector;
    return {
      type: "CNAME",
      subLabel: `${sel}._domainkey`,
      value: `${sel}-${dashed}._domainkey.onmicrosoft.com`,
      steps: [
        "Open Microsoft 365 Defender -> Email authentication -> DKIM and copy your exact *.onmicrosoft.com CNAME target if different.",
        "Add the CNAME record below in your DNS panel (make sure Cloudflare Proxy is OFF).",
        "Click Enable DKIM signing in Microsoft 365 and click Verify DNS Fix here.",
      ],
    };
  }

  if (provider === "google-workspace") {
    const sel = selector === "s1" ? "google" : selector;
    return {
      type: "TXT",
      subLabel: `${sel}._domainkey`,
      value: "v=DKIM1; k=rsa; p=<PASTE_2048_BIT_KEY_FROM_GOOGLE_ADMIN_APPS_GMAIL_AUTHENTICATE_EMAIL>",
      steps: [
        "In Google Admin -> Apps -> Google Workspace -> Gmail -> Authenticate email, choose 2048-bit key and selector 'google'.",
        "Copy the public key value and paste it into the TXT record below (replacing the placeholder p= value).",
        "Wait 2 minutes, click Start Authentication in Google Admin, then click Re-Verify DNS Fix.",
      ],
    };
  }

  return {
    type: "TXT",
    subLabel: `${selector}._domainkey`,
    value: "v=DKIM1; k=rsa; p=<PASTE_PUBLIC_KEY_FROM_YOUR_SMTP_PROVIDER>",
    steps: [
      `Open your SMTP/sending provider dashboard and copy the public key for selector "${selector}".`,
      "Publish the record below at your DNS host, ensuring there are no extra line breaks or quotes.",
      "Click Re-Verify Live DNS once saved.",
    ],
  };
}

export function buildRemediationPlan(
  diagnostics: DomainDiagnostics,
  options: { providerPreset?: ProviderPreset; fromEmail?: string } = {},
): RemediationPlan {
  const providerPreset: ProviderPreset =
    options.providerPreset ??
    (diagnostics.detectedProvider === "Microsoft 365"
      ? "microsoft-365"
      : diagnostics.detectedProvider === "Zoho Mail"
        ? "zoho"
        : "google-workspace");

  const { apexDomain, subPrefix } = splitDomainApex(diagnostics.domain);
  const dmarcEmail = options.fromEmail?.includes("@")
    ? `dmarc@${apexDomain}`
    : `postmaster@${apexDomain}`;

  const fixes: DnsFixCard[] = [];
  const healthyChecks: string[] = [];

  if (diagnostics.mx.status === "fail") {
    const mxVal =
      providerPreset === "microsoft-365"
        ? `0 ${diagnostics.domain.replace(/\./g, "-")}.mail.protection.outlook.com`
        : "1 smtp.google.com";
    fixes.push({
      id: "fix-mx",
      category: "MX",
      severity: "critical",
      title: "Add MX records so your sending domain can accept replies",
      plainEnglishWhy:
        "Inbox providers verify whether a cold email domain can actually receive replies. Domains without MX records look like throwaway spam bots.",
      howToFixSteps: [
        "Add the MX record below for your inbox provider.",
        "Confirm you can send and receive a test email on the mailbox before ramping outreach.",
      ],
      recordsByRegistrar: makeRegistrarMap("MX", "", mxVal, diagnostics.domain, apexDomain, subPrefix),
    });
  } else {
    healthyChecks.push(`MX routing active (${diagnostics.mx.records[0]?.exchange ?? "verified"})`);
  }

  if (diagnostics.spf.status !== "pass") {
    const providerInclude = spfIncludeForProvider(providerPreset);
    const cleanSpf =
      diagnostics.spf.records.length > 0 &&
      diagnostics.spf.lookupCount <= 10 &&
      diagnostics.spf.records.length === 1
        ? diagnostics.spf.records[0].replace(/\s*[+\-~?]?all\b.*$/i, "").trim() + " ~all"
        : `v=spf1 ${providerInclude} ~all`;

    const isLookupErr = diagnostics.spf.issues.some((i) => i.code === "SPF_TOO_MANY_LOOKUPS");
    const isMultiErr = diagnostics.spf.issues.some((i) => i.code === "SPF_MULTIPLE_RECORDS");

    fixes.push({
      id: "fix-spf",
      category: "SPF",
      severity: diagnostics.spf.status === "fail" ? "critical" : "warning",
      title: isLookupErr
        ? "Flatten SPF record below 10 DNS lookups"
        : isMultiErr
          ? "Merge duplicate SPF records into one TXT record"
          : "Publish a clean SPF record authorizing your sender",
      plainEnglishWhy: isLookupErr
        ? `Your SPF triggers ${diagnostics.spf.lookupCount} DNS lookups (max allowed is 10). When exceeded, Gmail and Outlook treat SPF as broken and route cold emails straight to spam.`
        : isMultiErr
          ? "Having two v=spf1 records causes receivers to fail SPF immediately. Combine all includes into a single TXT record."
          : "Without a valid SPF record, receiving servers cannot verify that your mail server is allowed to send on behalf of your domain.",
      howToFixSteps: [
        isMultiErr
          ? "Delete all existing v=spf1 TXT records on this host first."
          : "Edit or create the single TXT record below (never create a second v=spf1 record).",
        "Keep only the sending tools you actively use so total DNS lookups stay under 10.",
      ],
      recordsByRegistrar: makeRegistrarMap("TXT", "", cleanSpf, diagnostics.domain, apexDomain, subPrefix),
    });
  } else {
    healthyChecks.push(`SPF valid (${diagnostics.spf.lookupCount}/10 DNS lookups)`);
  }

  if (diagnostics.dkim.status !== "pass") {
    const dkimSpec = dkimSpecForProvider(providerPreset, diagnostics.dkim.selector, diagnostics.domain);
    fixes.push({
      id: "fix-dkim",
      category: "DKIM",
      severity: diagnostics.dkim.status === "fail" ? "critical" : "warning",
      title:
        diagnostics.dkim.status === "fail"
          ? `Publish missing DKIM key on selector "${diagnostics.dkim.selector}"`
          : `Upgrade 1024-bit DKIM key on selector "${diagnostics.dkim.selector}" to 2048-bit`,
      plainEnglishWhy:
        diagnostics.dkim.status === "fail"
          ? `Receivers checked ${diagnostics.dkim.selector}._domainkey.${diagnostics.domain} and found no valid cryptographic signature. Unsigned cold emails fail DMARC alignment and trigger spam folders.`
          : "Your DKIM signature works, but 1024-bit keys are nearing deprecation. Switching to 2048-bit protects your domain reputation.",
      howToFixSteps: dkimSpec.steps,
      recordsByRegistrar: makeRegistrarMap(
        dkimSpec.type,
        dkimSpec.subLabel,
        dkimSpec.value,
        diagnostics.domain,
        apexDomain,
        subPrefix,
      ),
    });
  } else {
    healthyChecks.push(
      `DKIM active on selector "${diagnostics.dkim.selector}" (${diagnostics.dkim.estimatedBits}-bit)`,
    );
  }

  if (diagnostics.dmarc.status !== "pass") {
    const targetPolicy = diagnostics.dmarc.policy === "reject" ? "reject" : "quarantine";
    const recommendedDmarc = `v=DMARC1; p=${targetPolicy}; pct=100; rua=mailto:${dmarcEmail}; adkim=r; aspf=r`;
    const isMissing = !diagnostics.dmarc.raw;

    fixes.push({
      id: "fix-dmarc",
      category: "DMARC",
      severity: isMissing ? "critical" : "warning",
      title: isMissing
        ? "Publish a DMARC record (required by Gmail & Yahoo)"
        : "Upgrade DMARC from monitor-only (p=none) to p=quarantine",
      plainEnglishWhy: isMissing
        ? "Google and Yahoo reject or spam-folder unauthenticated cold outreach without a DMARC record. Adding one takes 60 seconds and protects domain trust."
        : "Your current DMARC policy (p=none) doesn't stop spoofers or maximize sender trust. Upgrading to p=quarantine signals strong domain ownership.",
      howToFixSteps: [
        "Copy the exact TXT record below for your DNS provider.",
        "Ensure SPF and DKIM pass first so legitimate outreach stays aligned.",
      ],
      recordsByRegistrar: makeRegistrarMap(
        "TXT",
        "_dmarc",
        recommendedDmarc,
        diagnostics.domain,
        apexDomain,
        subPrefix,
      ),
    });
  } else {
    healthyChecks.push(`DMARC enforced (p=${diagnostics.dmarc.policy})`);
  }

  const spfFlattenerTip =
    diagnostics.spf.lookupCount >= 8
      ? `Your SPF currently resolves ${diagnostics.spf.includes.length} include domains (${diagnostics.spf.lookupCount}/10 lookups). Replace unused vendor includes or flatten static IPv4 ranges to stay safely under 10 lookups.`
      : null;

  return {
    domain: diagnostics.domain,
    apexDomain,
    subPrefix,
    providerPreset,
    fixes,
    healthyChecks,
    spfFlattenerTip,
  };
}
