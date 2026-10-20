// Deploy this module as a Cloudflare Worker, separately from the static website.
// Add TURNSTILE_SECRET_KEY and WHATSAPP_INVITE_URL as encrypted Worker secrets.
const ALLOWED_ORIGINS = new Set([
  'https://trailrunninginnsbruck.com',
  'https://www.trailrunninginnsbruck.com'
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Vary': 'Origin'
    };
    if (ALLOWED_ORIGINS.has(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
      headers['Access-Control-Allow-Headers'] = 'Content-Type';
    }
    const reply = (status, data) => new Response(JSON.stringify(data), { status, headers });

    if (request.method === 'GET' && url.pathname === '/') {
      return reply(200, { service: 'DNA Trails WhatsApp verification' });
    }
    if (url.pathname !== '/whatsapp') return reply(404, { error: 'Not found.' });
    if (!ALLOWED_ORIGINS.has(origin)) return reply(403, { error: 'Origin not allowed.' });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return reply(405, { error: 'Use POST.' });
    if (!env.TURNSTILE_SECRET_KEY || !env.WHATSAPP_INVITE_URL) {
      return reply(503, { error: 'Verification is not configured yet.' });
    }
    if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
      return reply(415, { error: 'Use JSON.' });
    }

    let body;
    try {
      // Bound the body even when Content-Length is missing or inaccurate.
      const reader = request.body?.getReader();
      if (!reader) return reply(400, { error: 'Missing verification token.' });
      const chunks = [];
      let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 4096) {
          await reader.cancel();
          return reply(413, { error: 'Request too large.' });
        }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      body = JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      return reply(400, { error: 'Invalid request.' });
    }
    if (typeof body?.token !== 'string' || !body.token.trim() || body.token.length > 2048) {
      return reply(400, { error: 'Missing or invalid verification token.' });
    }

    try {
      const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: env.TURNSTILE_SECRET_KEY,
          response: body.token,
          remoteip: request.headers.get('CF-Connecting-IP') || undefined
        }),
        signal: AbortSignal.timeout(10000)
      });
      if (!verification.ok) throw new Error('Verification unavailable');
      const result = await verification.json();
      if (result.success !== true || result.hostname !== new URL(origin).hostname || result.action !== 'whatsapp_join') {
        return reply(403, { error: 'Verification failed. Please try again.' });
      }
      const invite = new URL(env.WHATSAPP_INVITE_URL);
      if (invite.origin !== 'https://chat.whatsapp.com' || !/^\/[A-Za-z0-9_-]+$/.test(invite.pathname) || invite.search || invite.hash) {
        throw new Error('Invalid invite configuration');
      }
      return reply(200, { url: invite.href });
    } catch {
      return reply(503, { error: 'Verification is temporarily unavailable. Please try again.' });
    }
  }
};
