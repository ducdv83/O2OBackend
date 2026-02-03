export interface Env {
  /**
   * Example: https://your-nest-backend.example.com
   * (Do NOT include a trailing slash)
   */
  UPSTREAM_URL?: string;

  /**
   * Optional: override CORS origins (comma-separated).
   * Example: https://app.example.com,https://admin.example.com
   */
  CORS_ORIGIN?: string;
}

function corsHeaders(request: Request, env: Env): Headers {
  const origin = request.headers.get('Origin') ?? '';
  const allowList = (env.CORS_ORIGIN ?? '*')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const allowOrigin =
    allowList.includes('*') ? '*' : allowList.includes(origin) ? origin : '';

  const h = new Headers();
  if (allowOrigin) h.set('Access-Control-Allow-Origin', allowOrigin);
  h.set('Vary', 'Origin');
  h.set('Access-Control-Allow-Credentials', 'true');
  h.set(
    'Access-Control-Allow-Headers',
    request.headers.get('Access-Control-Request-Headers') ?? 'Content-Type, Authorization',
  );
  h.set(
    'Access-Control-Allow-Methods',
    request.headers.get('Access-Control-Request-Method') ?? 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  );
  h.set('Access-Control-Max-Age', '86400');
  return h;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    // Health check for the Worker itself
    if (url.pathname === '/worker-health') {
      const headers = corsHeaders(request, env);
      headers.set('Content-Type', 'application/json; charset=utf-8');
      return new Response(
        JSON.stringify({
          ok: true,
          worker: 'o2o-Service',
          has_upstream: Boolean(env.UPSTREAM_URL),
        }),
        { status: 200, headers },
      );
    }

    if (!env.UPSTREAM_URL) {
      const headers = corsHeaders(request, env);
      headers.set('Content-Type', 'application/json; charset=utf-8');
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'UPSTREAM_URL is not configured',
          hint: 'Set UPSTREAM_URL via `wrangler secret put UPSTREAM_URL` (or in wrangler.toml vars).',
        }),
        { status: 500, headers },
      );
    }

    // Proxy everything to upstream
    let upstreamBase: URL;
    try {
      upstreamBase = new URL(env.UPSTREAM_URL);
    } catch {
      const headers = corsHeaders(request, env);
      headers.set('Content-Type', 'application/json; charset=utf-8');
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'UPSTREAM_URL is invalid',
          upstream_url: env.UPSTREAM_URL,
          hint: 'It must include protocol, e.g. https://api.example.com (no trailing slash).',
        }),
        { status: 500, headers },
      );
    }

    const upstreamUrl = new URL(request.url);
    upstreamUrl.protocol = upstreamBase.protocol;
    upstreamUrl.host = upstreamBase.host;

    // Forward headers (avoid setting forbidden headers like Host)
    const headers = new Headers(request.headers);
    headers.set('X-Forwarded-Host', url.host);
    headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));

    const resp = await fetch(upstreamUrl.toString(), {
      method: request.method,
      headers,
      body:
        request.method === 'GET' || request.method === 'HEAD'
          ? undefined
          : request.body,
      redirect: 'manual',
    });

    // Attach CORS headers to upstream response
    const outHeaders = new Headers(resp.headers);
    const cors = corsHeaders(request, env);
    cors.forEach((v, k) => outHeaders.set(k, v));

    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers: outHeaders,
    });
  },
};

