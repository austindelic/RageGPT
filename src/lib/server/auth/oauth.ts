import { GitHub } from "arctic";
import { env } from "$env";

export const github = new GitHub(
  env.GITHUB_CLIENT_ID,
  env.GITHUB_CLIENT_SECRET,
  `${env.URL}/login/github/callback`,
);
