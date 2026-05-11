import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config — no database adapter, no Credentials authorize fn.
 * Used by middleware which runs in Edge runtime and can't load @libsql/client.
 * The full config (src/lib/auth/index.ts) extends this with the Drizzle adapter
 * and Credentials provider for sign-in flow.
 */

const isDev = process.env.NODE_ENV !== "production";
const authSecret =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  (isDev
    ? "dev-only-DO-NOT-USE-IN-PROD-asset-management-7d8a2f9c1e6b3a4f"
    : undefined);

export default {
  secret: authSecret,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token?.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
