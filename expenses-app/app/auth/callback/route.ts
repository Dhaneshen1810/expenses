import { NextResponse } from "next/server";

const CLIENT_ID = "expenses";

function authServerBaseUrl(): string {
  return (process.env.AUTH_SERVER_URL ?? "http://localhost:8080").replace(/\/$/, "");
}

function cookieSecure(requestUrl: URL): boolean {
  return requestUrl.protocol === "https:";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const returnTo = sameOriginUrl(
    requestUrl.searchParams.get("returnTo") ?? "/expenses",
    requestUrl
  );

  if (!code) {
    return NextResponse.redirect(new URL(`/expenses?auth_error=missing_code`, requestUrl.origin));
  }

  try {
    const res = await fetch(`${authServerBaseUrl()}/token`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        code,
      }),
      cache: "no-store",
    });

    const data: unknown = await res.json().catch(() => null);

    if (!res.ok || !hasTokens(data)) {
      const errorUrl = new URL("/expenses", requestUrl.origin);
      errorUrl.searchParams.set("auth_error", "token_exchange_failed");
      return NextResponse.redirect(errorUrl);
    }

    const response = NextResponse.redirect(returnTo);
    const secure = cookieSecure(requestUrl);

    response.cookies.set("access_token", data.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
    });
    response.cookies.set("refresh_token", data.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
    });

    return response;
  } catch {
    const errorUrl = new URL("/expenses", requestUrl.origin);
    errorUrl.searchParams.set("auth_error", "auth_service_unavailable");
    return NextResponse.redirect(errorUrl);
  }
}

function sameOriginUrl(raw: string, requestUrl: URL): URL {
  const fallback = new URL("/expenses", requestUrl.origin);

  try {
    const url = new URL(raw, requestUrl.origin);
    return url.origin === requestUrl.origin ? url : fallback;
  } catch {
    return fallback;
  }
}

function hasTokens(data: unknown): data is {
  access_token: string;
  refresh_token: string;
} {
  return (
    typeof data === "object" &&
    data !== null &&
    "access_token" in data &&
    typeof (data as { access_token: unknown }).access_token === "string" &&
    "refresh_token" in data &&
    typeof (data as { refresh_token: unknown }).refresh_token === "string"
  );
}
