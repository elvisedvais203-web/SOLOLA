import { NextRequest, NextResponse } from "next/server";
import { normalizeBackendApiUrl } from "../../../lib/nextalkapiresolve";

export async function POST(req: NextRequest) {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  const socketBase = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
  const apiBase = normalizeBackendApiUrl(
    envUrl || (socketBase ? `${socketBase.replace(/\/+$/, "")}/api` : undefined)
  );

  const authorization = req.headers.get("authorization");
  const csrf = req.headers.get("x-csrf-token");
  if (!authorization || !csrf) {
    return NextResponse.json({ message: "Authorization et x-csrf-token requis" }, { status: 401 });
  }

  const formData = await req.formData();
  const response = await fetch(`${apiBase}/media/upload`, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "x-csrf-token": csrf
    },
    body: formData
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
