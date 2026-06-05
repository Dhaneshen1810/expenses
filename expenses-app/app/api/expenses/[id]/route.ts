import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

function serverBaseUrl(): string | undefined {
  const raw =
    process.env.SERVER_URL ?? process.env.NEXT_PUBLIC_SERVER_URL ?? undefined;
  return raw?.replace(/\/$/, "");
}

type RouteParams = { params: Promise<{ id: string }> };

/**
 * DELETE /api/expenses/:id — proxies to the upstream API.
 */
export async function DELETE(_request: Request, context: RouteParams) {
  const base = serverBaseUrl();
  const authorization = await authorizationHeader(_request);
  if (!base) {
    return NextResponse.json(
      { error: "Server URL is not configured (SERVER_URL or NEXT_PUBLIC_SERVER_URL)" },
      { status: 503 }
    );
  }

  const { id: rawId } = await context.params;
  const id = encodeURIComponent(rawId);
  const url = `${base}/api/expenses/${id}`;

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        ...(authorization ? { Authorization: authorization } : {}),
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
          : { error: `Upstream returned ${res.status}`, detail: text.slice(0, 500) },
        { status: res.status }
      );
    }

    if (res.status === 204 || text === "") {
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json(data ?? {}, { status: res.status });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

async function authorizationHeader(request: Request): Promise<string | null> {
  const accessToken = (await cookies()).get("access_token")?.value;
  return request.headers.get("authorization") ?? (accessToken ? `Bearer ${accessToken}` : null);
}
