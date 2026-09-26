// Cloudflare Pages Function: POST /api/inquiry
// Receives the website inquiry form and emails it to GSSC management via Resend.
//
// Environment variables (Pages project → Settings → Variables and Secrets):
//   RESEND_API_KEY        (secret, required)  Resend API key
//   TURNSTILE_SECRET_KEY  (secret, required)  Cloudflare Turnstile secret key
//   MAIL_TO               (optional)          defaults to management@gsscph.com
//   MAIL_FROM             (optional)          defaults to "GSSC Website <inquiries@mail.gsscph.com>"

const DISCIPLINES = [
  "Sourcing & procurement",
  "Site execution",
  "Supply programmes",
  "Management consultancy",
  "Business support",
  "Compliance & documentation",
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

function oneLine(value) {
  return value.replace(/[\r\n]+/g, " ");
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

  const f = {
    disciplines: (Array.isArray(data.d) ? data.d : []).filter((d) => DISCIPLINES.includes(d)),
    value: oneLine(clean(data.v, 40)),
    start: oneLine(clean(data.t, 40)),
    site: oneLine(clean(data.s, 200)),
    name: oneLine(clean(data.n, 120)),
    org: oneLine(clean(data.o, 160)),
    email: clean(data.e, 200),
    phone: oneLine(clean(data.p, 60)),
    constraint: clean(data.c, 5000),
  };

  if (!f.disciplines.length || !f.name || !EMAIL_RE.test(f.email)) {
    return json(400, { ok: false, error: "Please choose at least one discipline and give your name and a valid email address." });
  }

  const text = [
    "Inquiry to GSSC Integrated Corporation (sent from gsscph.com)",
    "",
    "Disciplines: " + f.disciplines.join(", "),
    "Programme value: " + (f.value || "-"),
    "Start: " + (f.start || "-"),
    "Site: " + (f.site || "-"),
    "From: " + [f.name, f.org].filter(Boolean).join(", "),
    "Reply to: " + [f.email, f.phone].filter(Boolean).join(" · "),
    "",
    "Constraint:",
    f.constraint || "-",
    "",
    "Reply to this email to respond directly to " + f.name + ".",
  ].join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + env.RESEND_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.MAIL_FROM || "GSSC Website <inquiries@mail.gsscph.com>",
      to: [env.MAIL_TO || "management@gsscph.com"],
      reply_to: f.name.replace(/[<>"]/g, "") + " <" + f.email + ">",
      subject: "Inquiry · " + f.disciplines.join(", ") + (f.org ? " · " + f.org : ""),
      text,
    }),
  });

  if (!res.ok) {
    console.error("Resend error", res.status, await res.text().catch(() => ""));
    return json(502, { ok: false, error: "We couldn't send your inquiry right now." });
  }

  return json(200, { ok: true });
}
