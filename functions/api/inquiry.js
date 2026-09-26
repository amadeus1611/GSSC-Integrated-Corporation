// Cloudflare Pages Function: POST /api/inquiry
// Receives the website inquiry form and emails it to GSSC management via Resend.
//
// Environment variables (Pages project → Settings → Variables and Secrets):
//   RESEND_API_KEY        (secret, required)  Resend API key
//   TURNSTILE_SECRET_KEY  (secret, required)  Cloudflare Turnstile secret key
//   MAIL_TO               (optional)          defaults to management@gsscph.com
//   MAIL_FROM             (optional)          defaults to "GSSC Website <inquiries@mail.gsscph.com>"

const FIELDS = [
  ["Full name", 120],
  ["Company", 160],
  ["Email", 200],
  ["Phone", 60],
  ["Inquiry type", 80],
  ["Timeline", 80],
  ["Requirement summary", 5000],
  ["Documents needed", 3000],
];

const CHECKS = [
  "Need supplier sourcing",
  "Need quotation coordination",
  "Need onboarding documents",
  "Need management summary",
];

const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function clean(value, max) {
  return String(value == null ? "" : value).replace(/\r\n?/g, "\n").trim().slice(0, max);
}

async function verifyTurnstile(secret, token, ip) {
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });
  const out = await res.json().catch(() => ({}));
  return out.success === true;
}

export async function onRequestPost({ request, env }) {
  if (!env.RESEND_API_KEY || !env.TURNSTILE_SECRET_KEY) {
    return json(503, { ok: false, error: "The inquiry service is not configured yet." });
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return json(400, { ok: false, error: "Invalid request." });
  }

  // Honeypot: real visitors never fill this hidden field.
  if (clean(data.website, 200)) return json(200, { ok: true });

  const token = clean(data.turnstileToken, 4096);
  const ip = request.headers.get("CF-Connecting-IP") || "";
  if (!token || !(await verifyTurnstile(env.TURNSTILE_SECRET_KEY, token, ip))) {
    return json(403, { ok: false, error: "Verification failed. Please refresh the page and try again." });
  }

  const f = {};
  for (const [name, max] of FIELDS) f[name] = clean(data[name], max);
  const selected = CHECKS.filter((c) => data[c] === true || data[c] === "on");

  if (!f["Full name"] || !f["Requirement summary"] || !EMAIL_RE.test(f["Email"])) {
    return json(400, { ok: false, error: "Please fill in your name, a valid email address and the requirement summary." });
  }

  const text = [
    "GSSC Integrated Corporation - Business Inquiry (sent from gsscph.com)",
    "",
    "Full name: " + f["Full name"],
    "Company / organization: " + (f["Company"] || "—"),
    "Email: " + f["Email"],
    "Phone / messaging: " + (f["Phone"] || "—"),
    "Inquiry type: " + (f["Inquiry type"] || "—"),
    "Target timeline: " + (f["Timeline"] || "—"),
    "",
    "Requirement summary:",
    f["Requirement summary"],
    "",
    "Documents or verification needed:",
    f["Documents needed"] || "—",
    "",
    "Selected support items:",
    selected.length ? selected.map((x) => "- " + x).join("\n") : "—",
    "",
    "Reply to this email to respond directly to " + f["Full name"] + ".",
  ].join("\n");

  const subjectName = (f["Company"] || f["Full name"]).replace(/[\r\n]+/g, " ");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + env.RESEND_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.MAIL_FROM || "GSSC Website <inquiries@mail.gsscph.com>",
      to: [env.MAIL_TO || "management@gsscph.com"],
      reply_to: f["Full name"].replace(/[<>"\r\n]/g, "") + " <" + f["Email"] + ">",
      subject: "Business Inquiry - " + subjectName,
      text,
    }),
  });

  if (!res.ok) {
    console.error("Resend error", res.status, await res.text().catch(() => ""));
    return json(502, { ok: false, error: "We couldn't send your inquiry right now. Please email management@gsscph.com directly." });
  }

  return json(200, { ok: true });
}
