"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db, schema } from "@/db";
import { ActionError, fail, ok, requireUserId } from "./_helpers";

const accountTypes = [
  "cash",
  "bank",
  "credit_card",
  "stock",
  "crypto",
  "real_estate",
  "loan",
  "other",
] as const;

const upsertSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "이름을 입력해 주세요.").max(40),
  type: z.enum(accountTypes),
  currency: z.string().length(3).default("KRW"),
  initialBalance: z.coerce.number().default(0),
  icon: z.string().max(40).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

function readFormData(formData: FormData) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) {
    if (k.startsWith("$ACTION_")) continue;
    out[k] = v;
  }
  return out;
}

export async function upsertAccount(formData: FormData) {
  try {
    const userId = await requireUserId();
    const parsed = upsertSchema.safeParse(readFormData(formData));
    if (!parsed.success) {
      throw new ActionError(parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.");
    }
    const data = parsed.data;
    const id = data.id ?? nanoid();

    if (data.id) {
      await db
        .update(schema.accounts)
        .set({
          name: data.name,
          type: data.type,
          currency: data.currency,
          initialBalance: data.initialBalance,
          icon: data.icon ?? null,
          color: data.color ?? null,
          sortOrder: data.sortOrder,
        })
        .where(
          and(
            eq(schema.accounts.id, data.id),
            eq(schema.accounts.userId, userId)
          )
        );
    } else {
      await db.insert(schema.accounts).values({
        id,
        userId,
        name: data.name,
        type: data.type,
        currency: data.currency,
        initialBalance: data.initialBalance,
        icon: data.icon ?? null,
        color: data.color ?? null,
        sortOrder: data.sortOrder,
      });
    }
    revalidatePath("/accounts");
    revalidatePath("/settings/accounts");
    revalidatePath("/transactions");
    return ok({ id });
  } catch (e) {
    return fail(e);
  }
}

export async function archiveAccount(id: string, archived = true) {
  try {
    const userId = await requireUserId();
    if (!id) throw new ActionError("계정을 찾을 수 없어요.");
    await db
      .update(schema.accounts)
      .set({ isArchived: archived })
      .where(and(eq(schema.accounts.id, id), eq(schema.accounts.userId, userId)));
    revalidatePath("/accounts");
    revalidatePath("/settings/accounts");
    return ok({ id });
  } catch (e) {
    return fail(e);
  }
}
