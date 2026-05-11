import NextAuth from "next-auth";
import authConfig from "@/lib/auth/config";

/**
 * Auth.js v5 canonical middleware. The `authorized` callback in authConfig
 * drives redirect logic. This export pattern is what triggers Next.js to
 * compile middleware as an Edge function (middleware-manifest.json entry).
 */
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)",
  ],
};
