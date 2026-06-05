import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ status: "success" });

  response.cookies.delete("access_token");
  response.cookies.delete("refresh_token");

  return response;
}
