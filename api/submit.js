// Vercel Serverless Function (Node.js) — POST /api/submit
// Requires the DISCORD_WEBHOOK_URL environment variable (set in Vercel, never in the repo).

const USERNAME_RE = /^[A-Za-z0-9_. ]{3,17}$/;
const PUNISHMENT_ID_RE = /^[A-Za-z0-9#_-]{1,32}$/;
const PUNISHMENT_TYPES = new Set(['Ban', 'Mute']);
const REASON_MIN = 20;
const REASON_MAX = 1000;
const MAX_BODY_BYTES = 8 * 1024;
const WEBHOOK_PREFIXES = [
  'https://discord.com/api/webhooks/',
  'https://discordapp.com/api/webhooks/',
];

// Best-effort limiter: state lives in one serverless instance's memory, so it resets on
// cold starts and is NOT shared between instances. It only slows trivial spam; use
// Vercel Firewall rate limiting or a shared store for real protection.
const recent = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 3;

function isRateLimited(ip) {
  const now = Date.now();
  const hits = (recent.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) {
    recent.set(ip, hits);
    return true;
  }
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 500) {
    for (const [key, times] of recent) {
      if (!times.some((t) => now - t < WINDOW_MS)) recent.delete(key);
    }
  }
  return false;
}

function send(res, status, success, message) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.status(status).json({ success, message });
}

function isSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true; // non-browser or same-origin requests without Origin
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

function clean(value) {
  // Trim and strip control characters (keeps newlines and tabs).
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, false, 'Method not allowed.');
  }

  if (!isSameOrigin(req)) {
    return send(res, 403, false, 'Request not allowed.');
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl || !WEBHOOK_PREFIXES.some((p) => webhookUrl.startsWith(p))) {
    console.error('Appeal API: DISCORD_WEBHOOK_URL is missing or invalid.');
    return send(res, 500, false, 'Unable to submit your appeal right now.');
  }

  try {
    const contentType = String(req.headers['content-type'] || '');
    const length = Number(req.headers['content-length'] || 0);
    if (!contentType.includes('application/json') || length > MAX_BODY_BYTES) {
      return send(res, 400, false, 'Invalid request.');
    }

    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch {
      return send(res, 400, false, 'Invalid request.');
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return send(res, 400, false, 'Invalid request.');
    }

    // Honeypot: real users never fill this. Pretend success so bots learn nothing.
    if (typeof body.website === 'string' && body.website.trim() !== '') {
      return send(res, 200, true, 'Appeal submitted successfully.');
    }

    for (const key of ['username', 'punishmentType', 'reason']) {
      if (typeof body[key] !== 'string') {
        return send(res, 400, false, 'Please fill in all required fields.');
      }
    }
    if (body.punishmentId != null && typeof body.punishmentId !== 'string') {
      return send(res, 400, false, 'Invalid punishment ID.');
    }

    const username = clean(body.username);
    const punishmentType = clean(body.punishmentType);
    const punishmentId = clean(body.punishmentId);
    const reason = clean(body.reason);

    if (!USERNAME_RE.test(username)) {
      return send(res, 400, false, 'Please enter a valid Minecraft username.');
    }
    if (!PUNISHMENT_TYPES.has(punishmentType)) {
      return send(res, 400, false, 'Please choose Ban or Mute.');
    }
    if (punishmentId && !PUNISHMENT_ID_RE.test(punishmentId)) {
      return send(res, 400, false, 'Please enter a valid punishment ID.');
    }
    if (reason.length < REASON_MIN || reason.length > REASON_MAX) {
      return send(
        res,
        400,
        false,
        `Your reason must be between ${REASON_MIN} and ${REASON_MAX} characters.`
      );
    }

    const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const ip = forwarded || req.socket?.remoteAddress || 'unknown';
    if (isRateLimited(ip)) {
      return send(res, 429, false, 'Too many appeals. Please try again later.');
    }

    // Discord limits: field value 1024, field name 256. Inputs are already capped below that.
    const payload = {
      content: 'New Punishment Appeal',
      allowed_mentions: { parse: [] }, // user text can never ping anyone
      embeds: [
        {
          title: 'Punishment Appeal',
          color: 0xff8a00,
          fields: [
            { name: 'Minecraft Username', value: `\`${username}\``, inline: true },
            { name: 'Punishment Type', value: punishmentType, inline: true },
            { name: 'Punishment ID', value: punishmentId ? `\`${punishmentId}\`` : 'Not provided', inline: true },
            { name: 'Reason', value: reason.slice(0, 1024) },
          ],
          footer: { text: 'JalebiMC Punishment Appeals' },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    let discordRes;
    try {
      discordRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!discordRes.ok) {
      console.error(`Appeal API: Discord webhook responded with status ${discordRes.status}.`);
      return send(res, 500, false, 'Unable to submit your appeal right now.');
    }

    return send(res, 200, true, 'Appeal submitted successfully.');
  } catch (err) {
    console.error('Appeal API: unexpected error:', err && err.name);
    return send(res, 500, false, 'Unable to submit your appeal right now.');
  }
};
