import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { cache } from "react";
import { db, schema } from "@/db";
import { verifyPassword } from "./password";
import authConfig from "./config";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

/**
 * Full auth config — extends the edge-safe base (./config) with:
 *  - Drizzle DB adapter (Node-only, can't run in Edge)
 *  - Credentials provider with authorize() that hits the DB
 *
 * Middleware imports ./config directly (no DB), this file is used by
 * Server Components, Server Actions, and the /api/auth route handlers.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts_auth,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  providers: [
    Credentials({
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const found = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.email, email))
          .limit(1);
        const user = found[0];
        if (!user || !user.passwordHash) return null;
        if (!verifyPassword(password, user.passwordHash)) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
        };
      },
    }),
  ],
});

export const getSession = cache(() => auth());
