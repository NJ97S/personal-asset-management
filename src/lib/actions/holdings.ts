"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db, schema } from "@/db";
import { ActionError, fail, ok, requireUserId } from "./_helpers";
import { fetchPriceFor } from "@/lib/prices";

const assetClasses = [
  "stock_kr",
  "stock_us",
  "etf",
  "fund",
  "crypto",
  "other",
] as const;

const upsertSchema = z
  .object({
    id: z.string().optional(),
    accountId: z.string().min(1, "계정을 선택해 주세요."),
    ticker: z.string().min(1, "종목코드를 입력해 주세요.").max(40),
    name: z.string().max(80).optional().nullable(),
    exchange: z.string().max(20).optional().nullable(),
    assetClass: z.enum(assetClasses),
    quantity: z.coerce.number().min(0, "수량은 0 이상이어야 해요."),
    avgBuyPrice: z.coerce.number().min(0, "평균가는 0 이상이어야 해요."),
    // 빈 문자열을 먼저 null 로 정규화한 뒤 숫자 강제 변환.
    // (union + coerce 조합은 "" 를 0 으로 삼켜버려서 manualValue=0 이 저장되는 버그가 있었음.)
    manualValue: z.preprocess(
      (v) => (v === "" || v == null ? null : v),
      z.coerce.number().positive("평가금액은 0보다 커야 해요.").nullable()
    ),
  })
  .refine((d) => d.manualValue != null || d.quantity > 0, {
    message: "수량을 0보다 크게 입력해 주세요.",
    path: ["quantity"],
  })
  .refine((d) => d.manualValue != null || d.avgBuyPrice > 0, {
    message: "평균 매입가를 0보다 크게 입력해 주세요.",
    path: ["avgBuyPrice"],
  });

function readFormData(formData: FormData) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) {
    if (k.startsWith("$ACTION_")) continue;
    out[k] = v;
  }
  return out;
}

export async function upsertHolding(formData: FormData) {
  try {
    const userId = await requireUserId();
    const parsed = upsertSchema.safeParse(readFormData(formData));
    if (!parsed.success) {
      throw new ActionError(
        parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요."
      );
    }
    const data = parsed.data;
    const id = data.id ?? nanoid();

    // 시세가 붙는 종목군은 manualValue 를 절대 갖지 않는다.
    // 클라이언트가 잘못 보내거나 과거 손상된 행이 재편집될 때 자동 정상화.
    const manualValue =
      data.assetClass === "other" ? data.manualValue ?? null : null;

    if (data.id) {
      await db
        .update(schema.holdings)
        .set({
          accountId: data.accountId,
          ticker: data.ticker,
          name: data.name ?? null,
          exchange: data.exchange ?? null,
          assetClass: data.assetClass,
          quantity: data.quantity,
          avgBuyPrice: data.avgBuyPrice,
          manualValue,
        })
        .where(
          and(eq(schema.holdings.id, data.id), eq(schema.holdings.userId, userId))
        );
    } else {
      await db.insert(schema.holdings).values({
        id,
        userId,
        accountId: data.accountId,
        ticker: data.ticker,
        name: data.name ?? null,
        exchange: data.exchange ?? null,
        assetClass: data.assetClass,
        quantity: data.quantity,
        avgBuyPrice: data.avgBuyPrice,
        manualValue,
      });
    }
    revalidatePath("/settings/holdings");
    revalidatePath("/accounts");
    revalidatePath("/");
    return ok({ id });
  } catch (e) {
    return fail(e);
  }
}

export async function deleteHolding(id: string) {
  try {
    const userId = await requireUserId();
    if (!id) throw new ActionError("종목을 찾을 수 없어요.");
    await db
      .delete(schema.holdings)
      .where(
        and(eq(schema.holdings.id, id), eq(schema.holdings.userId, userId))
      );
    revalidatePath("/settings/holdings");
    revalidatePath("/accounts");
    revalidatePath("/");
    return ok({ id });
  } catch (e) {
    return fail(e);
  }
}

// 사용자가 직접 시세를 갱신하기 위한 액션.
// 매일 09:30 KST 크론을 기다리지 않고 즉시 prices 테이블을 채워 0% 고정을 풀 수 있다.
export async function refreshHoldingPrices() {
  try {
    const userId = await requireUserId();

    const rows = await db
      .select()
      .from(schema.holdings)
      .where(eq(schema.holdings.userId, userId));

    const targets = rows.filter(
      (h) =>
        h.assetClass !== "other" &&
        !(h.manualValue != null && h.manualValue > 0)
    );

    if (targets.length === 0) {
      return ok({ ok: 0, failed: 0, errors: [] as string[] });
    }

    const results = await Promise.allSettled(
      targets.map(async (h) => {
        const q = await fetchPriceFor(h);
        const dateStr = q.asOf.slice(0, 10);
        await db
          .insert(schema.prices)
          .values({
            ticker: h.ticker,
            date: dateStr,
            close: q.close,
            currency: q.currency,
          })
          .onConflictDoUpdate({
            target: [schema.prices.ticker, schema.prices.date],
            set: { close: q.close, currency: q.currency },
          });
        await db
          .update(schema.holdings)
          .set({ lastPricedAt: new Date() })
          .where(eq(schema.holdings.id, h.id));
        return h.ticker;
      })
    );

    let okCount = 0;
    let failed = 0;
    const errors: string[] = [];
    results.forEach((r, idx) => {
      if (r.status === "fulfilled") {
        okCount++;
      } else {
        failed++;
        const ticker = targets[idx]?.ticker ?? "?";
        const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
        errors.push(`${ticker}: ${msg}`);
      }
    });

    revalidatePath("/settings/holdings");
    revalidatePath("/accounts");
    revalidatePath("/");
    return ok({ ok: okCount, failed, errors });
  } catch (e) {
    return fail(e);
  }
}
