"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db, schema } from "@/db";
import { ActionError, fail, ok, requireUserId } from "./_helpers";

const baseFields = {
  occurredAt: z
    .union([z.string(), z.date()])
    .transform((v) => (typeof v === "string" ? new Date(v) : v))
    .refine((d) => !Number.isNaN(d.getTime()), "올바른 날짜를 입력해 주세요."),
  amount: z.coerce.number().positive("0보다 큰 금액이어야 해요."),
  currency: z.string().length(3).default("KRW"),
  payee: z.string().max(120).optional().nullable(),
  memo: z.string().max(500).optional().nullable(),
};

const incomeOrExpenseSchema = z.object({
  type: z.enum(["income", "expense"]),
  accountId: z.string().min(1, "계정을 선택해 주세요."),
  categoryId: z.string().min(1, "카테고리를 선택해 주세요."),
  ...baseFields,
});

const transferSchema = z.object({
  type: z.literal("transfer"),
  fromAccountId: z.string().min(1, "보내는 계정을 선택해 주세요."),
  toAccountId: z.string().min(1, "받는 계정을 선택해 주세요."),
  ...baseFields,
});

const tradeSchema = z.object({
  type: z.literal("trade"),
  tradeKind: z.enum(["buy", "sell"]),
  accountId: z.string().min(1),
  ticker: z.string().min(1),
  quantity: z.coerce.number().positive(),
  pricePerUnit: z.coerce.number().positive(),
  fee: z.coerce.number().min(0).default(0),
  ...baseFields,
});

const createTxSchema = z.discriminatedUnion("type", [
  incomeOrExpenseSchema,
  transferSchema,
  tradeSchema,
]);

export type CreateTxInput = z.infer<typeof createTxSchema>;

function readFormData<T extends Record<string, unknown>>(formData: FormData): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) {
    if (k.startsWith("$ACTION_")) continue;
    out[k] = typeof v === "string" ? v : v;
  }
  return out as T;
}

export async function createTransaction(formData: FormData) {
  try {
    const userId = await requireUserId();
    const raw = readFormData(formData);
    const parsed = createTxSchema.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      throw new ActionError(first?.message ?? "입력값을 확인해 주세요.");
    }
    const input = parsed.data;
    if (input.type === "transfer" && input.fromAccountId === input.toAccountId) {
      throw new ActionError("같은 계정 간 이체는 만들 수 없어요.");
    }

    const id = nanoid();
    const common = {
      id,
      userId,
      occurredAt: input.occurredAt,
      type: input.type,
      amount: input.amount,
      currency: input.currency,
      payee: input.payee ?? null,
      memo: input.memo ?? null,
    };

    switch (input.type) {
      case "income":
      case "expense":
        await db.insert(schema.transactions).values({
          ...common,
          accountId: input.accountId,
          categoryId: input.categoryId,
        });
        break;
      case "transfer":
        await db.insert(schema.transactions).values({
          ...common,
          fromAccountId: input.fromAccountId,
          toAccountId: input.toAccountId,
        });
        break;
      case "trade":
        await db.insert(schema.transactions).values({
          ...common,
          accountId: input.accountId,
          tradeKind: input.tradeKind,
          ticker: input.ticker,
          quantity: input.quantity,
          pricePerUnit: input.pricePerUnit,
          fee: input.fee,
        });
        break;
    }

    revalidatePath("/");
    revalidatePath("/transactions");
    revalidatePath("/accounts");
    return ok({ id });
  } catch (e) {
    return fail(e);
  }
}

const updateTxSchema = z.object({
  id: z.string().min(1),
  occurredAt: z
    .union([z.string(), z.date()])
    .optional()
    .transform((v) =>
      v == null ? undefined : typeof v === "string" ? new Date(v) : v
    ),
  amount: z.coerce.number().positive().optional(),
  payee: z.string().max(120).optional().nullable(),
  memo: z.string().max(500).optional().nullable(),
  categoryId: z.string().optional().nullable(),
  accountId: z.string().optional().nullable(),
});

export async function updateTransaction(formData: FormData) {
  try {
    const userId = await requireUserId();
    const parsed = updateTxSchema.safeParse(readFormData(formData));
    if (!parsed.success) throw new ActionError("입력값을 확인해 주세요.");

    const { id, ...patch } = parsed.data;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    for (const [k, v] of Object.entries(patch)) {
      if (v !== undefined) updates[k] = v;
    }
    if (Object.keys(updates).length === 1) return ok({ id });

    const result = await db
      .update(schema.transactions)
      .set(updates)
      .where(
        and(
          eq(schema.transactions.id, id),
          eq(schema.transactions.userId, userId)
        )
      );
    revalidatePath("/");
    revalidatePath("/transactions");
    return ok({ id, rows: result.rowsAffected ?? 0 });
  } catch (e) {
    return fail(e);
  }
}

export async function deleteTransaction(id: string) {
  try {
    const userId = await requireUserId();
    if (!id) throw new ActionError("삭제할 거래를 찾을 수 없어요.");
    await db
      .delete(schema.transactions)
      .where(
        and(
          eq(schema.transactions.id, id),
          eq(schema.transactions.userId, userId)
        )
      );
    revalidatePath("/");
    revalidatePath("/transactions");
    revalidatePath("/accounts");
    return ok({ id });
  } catch (e) {
    return fail(e);
  }
}
