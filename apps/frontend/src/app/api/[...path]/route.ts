import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getBackendOrigin } from "../../../lib/nextalkbackendorigin";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host"
]);

async function proxy(req: NextRequest, segments: string[]) {
  const path = segments.join("/");
  const origin = getBackendOrigin();
  const target = `${origin}/api/${path}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return;
    headers.set(key, value);
  });

  const method = req.method;
  const init: RequestInit = {
    method,
    headers,
    redirect: "manual"
  };

  if (method !== "GET" && method !== "HEAD") {
    init.body = req.body;
    Object.assign(init, { duplex: "half" });
  }

  const res = await fetch(target, init as RequestInit);

  const out = new NextResponse(res.body, {
    status: res.status,
    statusText: res.statusText
  });
  res.headers.forEach((value, key) => {
    const low = key.toLowerCase();
    if (low === "transfer-encoding") return;
    out.headers.set(key, value);
  });
  return out;
}

type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}

export async function OPTIONS(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}
