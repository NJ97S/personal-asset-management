import { auth } from "@/lib/auth";

export class ActionError extends Error {
  code: string;
  constructor(message: string, code = "INVALID") {
    super(message);
    this.code = code;
  }
}

export async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new ActionError("로그인이 필요해요.", "UNAUTHORIZED");
  return id;
}

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; code: string };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(err: unknown): ActionResult<never> {
  if (err instanceof ActionError) {
    return { ok: false, error: err.message, code: err.code };
  }
  console.error("[action] unexpected error", err);
  return {
    ok: false,
    error: "처리 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
    code: "INTERNAL",
  };
}
