import { createSession, setSessionTokenCookie } from "$server/auth/session";
import { github } from "$server/auth/oauth";
import { cookies } from "next/headers";
import { createUser, getUserFromGitHubId } from "$server/db/queries/user";
import { ObjectParser } from "@pilcrowjs/object-parser";

import type { OAuth2Tokens } from "arctic";
import { UserDraft } from "$schema_types";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  if (state !== null) {
    cookieStore.set("github_oauth_state", state, {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    });
  }
  const storedState = cookieStore.get("github_oauth_state")?.value ?? null;
  if (code === null || state === null || storedState === null) {
    return new Response("Please restart the process. code", {
      status: 400,
    });
  }
  if (state !== storedState) {
    return new Response("Please restart the process. state", {
      status: 400,
    });
  }

  let tokens: OAuth2Tokens;

  try {
    tokens = await github.validateAuthorizationCode(code);
  } catch {
    return new Response("Please restart the process. validate tokens", {
      status: 400,
    });
  }

  const githubAccessToken = tokens.accessToken();

  const userRequest = new Request("https://api.github.com/user");
  userRequest.headers.set("Authorization", `Bearer ${githubAccessToken}`);
  const userResponse = await fetch(userRequest);
  const userResult: unknown = await userResponse.json();
  const userParser = new ObjectParser(userResult);

  const githubUserId = userParser.getNumber("id");
  const username = userParser.getString("login");

  const existingUser = await getUserFromGitHubId(githubUserId);
  if (existingUser !== null) {
    const session = await createSession(existingUser.id);
    await setSessionTokenCookie(session);
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  }

  const user_data = {
    username,
    github_id: githubUserId,
  } as UserDraft;
  const user = await createUser(user_data);
  if (!user) {
    return new Response(null, {
      status: 500,
      headers: {
        Location: "/SHIT IS FUCKED UP GOTTA MAKE ROOM FOR THIS ERROR",
      },
    });
  }
  const session = await createSession(user.id);
  await setSessionTokenCookie(session);

  return new Response(null, {
    status: 302,
    headers: {
      Location: "/",
    },
  });
}
