import { NextResponse } from "next/server";
import { generateState } from "arctic";
import { github } from "$server/auth/oauth"; // adjust import path accordingly

export async function GET() {
  const state = generateState();
  const url = github.createAuthorizationURL(state, []);

  const res = NextResponse.redirect(url.toString());

  res.cookies.set("github_oauth_state", state, {
    path: "/",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  return res;
}
