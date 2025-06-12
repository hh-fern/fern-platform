/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable turbo/no-undeclared-env-vars */
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  console.log("here!!!@@!@");
  const { AUTH0_DOMAIN, AUTH0_CLIENT_ID } = process.env;
  const returnTo = req.nextUrl.searchParams.get("returnTo") ?? "/";
  const loginUrl = new URL(`${AUTH0_DOMAIN}/authorize`);

  loginUrl.searchParams.set("client_id", AUTH0_CLIENT_ID!);
  loginUrl.searchParams.set(
    "redirect_uri",
    `${process.env.AUTH0_DOMAIN}/api/auth/callback`
  );
  loginUrl.searchParams.set("response_type", "code");
  loginUrl.searchParams.set("scope", "openid profile email");
  loginUrl.searchParams.set("connection", "github"); // ⬅️ force GitHub
  loginUrl.searchParams.set("prompt", "login"); // ⬅️ force re-consent
  loginUrl.searchParams.set("state", returnTo); // you can also use a real state generator

  return NextResponse.redirect(loginUrl.toString());
}
