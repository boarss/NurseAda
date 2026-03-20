/**
 * Proxies browser requests to the NurseAda API gateway (same-origin on Vercel).
 *
 * Set on Vercel (server): GATEWAY_URL=https://your-gateway-host
 * Set in the browser: NEXT_PUBLIC_GATEWAY_URL=/api/gateway
 *
 * Local direct calls can skip the proxy: NEXT_PUBLIC_GATEWAY_URL=http://localhost:8080
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ path: string[] }> };

function upstreamBase(): string | null {
  const raw =
    process.env.GATEWAY_URL?.trim() ||
    process.env.GATEWAY_INTERNAL_URL?.trim() ||
    "";
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

function forwardRequestHeaders(req: NextRequest): Headers {
  const h = new Headers();
  const auth = req.headers.get("authorization");
  if (auth) h.set("authorization", auth);
  const ct = req.headers.get("content-type");
  if (ct) h.set("content-type", ct);
  const accept = req.headers.get("accept");
  if (accept) h.set("accept", accept);
  return h;
}

async function proxy(req: NextRequest, context: Ctx): Promise<NextResponse> {
  const { path: segments } = await context.params;
  const base = upstreamBase();
  if (!base) {
    return NextResponse.json(
      { detail: "Gateway proxy is not configured. Set GATEWAY_URL on the server." },
      { status: 503 }
    );
  }

  const { search } = new URL(req.url);
  const pathPart = (segments ?? []).length ? `/${(segments ?? []).join("/")}` : "/";
  const target = `${base}${pathPart}${search}`;

  const method = req.method.toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method);

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method,
      headers: forwardRequestHeaders(req),
      body: hasBody ? await req.arrayBuffer() : undefined,
      cache: "no-store",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upstream request failed";
    return NextResponse.json({ detail: msg }, { status: 502 });
  }

  const out = new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
  });

  const passThrough = [
    "content-type",
    "content-length",
    "cache-control",
    "etag",
  ] as const;
  for (const name of passThrough) {
    const v = upstream.headers.get(name);
    if (v) out.headers.set(name, v);
  }

  return out;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
