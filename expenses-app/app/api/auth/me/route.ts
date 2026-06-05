import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

function expensesServerBaseUrl(): string {
  return (
    process.env.SERVER_URL ??
    process.env.NEXT_PUBLIC_SERVER_URL ??
    "http://localhost:8000"
  ).replace(/\/$/, "");
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const authorization =
    request.headers.get("authorization") ??
    (accessToken ? `Bearer ${accessToken}` : null);

  if (!authorization) {
    return NextResponse.json(
      { error: "Missing Authorization bearer token" },
      { status: 401 }
    );
  }

  try {
    const res = await fetch(`${expensesServerBaseUrl()}/api/session`, {
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
