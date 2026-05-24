import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function serverBaseUrl(): string | undefined {
  const raw =
    process.env.SERVER_URL ?? process.env.NEXT_PUBLIC_SERVER_URL ?? undefined;
  return raw?.replace(/\/$/, "");
}

/**
 * GET /api/expenses — proxies to `${SERVER_URL|NEXT_PUBLIC_SERVER_URL}/api/expenses` when set.
 * Without either, returns [] so the UI can load during local setup.
 */
export async function GET() {
  const base = serverBaseUrl();
  if (!base) {
    return NextResponse.json([]);
  }

  try {
    const res = await fetch(`${base}/api/expenses`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        {
          error: `Upstream returned ${res.status}`,
          detail: text.slice(0, 500),
        },
        { status: res.status }
      );
    }

    let data: unknown;
    try {
      data = text ? JSON.parse(text) : [];
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON from upstream" },
        { status: 502 }
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

/**
 * POST /api/expenses — forwards JSON body to `${SERVER_URL|NEXT_PUBLIC_SERVER_URL}/api/expenses`.
 */
export async function POST(request: Request) {
  const base = serverBaseUrl();
  if (!base) {
    return NextResponse.json(
      { error: "Server URL is not configured (SERVER_URL or NEXT_PUBLIC_SERVER_URL)" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const res = await fetch(`${base}/api/expenses`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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
          : { error: `Upstream returned ${res.status}`, detail: text.slice(0, 500) },
        { status: res.status }
      );
    }

    return NextResponse.json(data ?? {}, { status: res.status });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
