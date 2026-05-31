import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function authServerBaseUrl(): string {
  return (process.env.AUTH_SERVER_URL ?? "http://localhost:8080").replace(/\/$/, "");
}

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json(
      { error: "Missing Authorization bearer token" },
      { status: 401 }
    );
  }

  try {
    const res = await fetch(`${authServerBaseUrl()}/me`, {
      headers: {
        Accept: "application/json",
        Authorization: authorization,
      },
      cache: "no-store",
    });

    const text = await res.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
    }

    if (!res.ok) {
      return NextResponse.json(
        typeof data === "object" && data !== null
          ? data
          : { error: `Auth service returned ${res.status}` },
        { status: res.status }
      );
    }

    return NextResponse.json(data ?? {}, { status: res.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Auth service unavailable";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
