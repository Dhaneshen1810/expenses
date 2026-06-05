import { NextResponse } from "next/server";

function authLoginUrl(): string {
  return (
    process.env.AUTH_LOGIN_URL ??
    process.env.AUTH_SERVER_URL ??
    "http://localhost:8080"
  ).replace(/\/$/, "");
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const loginUrl = new URL(authLoginUrl());
  const callbackUrl = new URL("/auth/callback", requestUrl.origin);
  const returnTo = sameOriginUrl(
    requestUrl.searchParams.get("returnTo") ?? "/expenses",
    requestUrl
  );

  callbackUrl.searchParams.set("returnTo", returnTo.toString());

  loginUrl.searchParams.set("client_id", "expenses");
  loginUrl.searchParams.set("redirect_uri", callbackUrl.toString());

  if (!loginUrl.searchParams.has("returnTo")) {
    loginUrl.searchParams.set("returnTo", returnTo.toString());
  }

  return NextResponse.redirect(loginUrl);
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
