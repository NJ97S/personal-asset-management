import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db, schema } from "@/db";

const HEADERS = [
  "id",
  "occurred_at",
  "type",
  "amount",
  "currency",
  "account",
  "from_account",
  "to_account",
  "category",
  "category_kind",
  "trade_kind",
  "ticker",
  "quantity",
  "price_per_unit",
  "fee",
  "payee",
  "memo",
  "created_at",
];

function csvEscape(value: unknown): string {
  if (value == null) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "csv";

  const [accounts, categories, transactions] = await Promise.all([
    db.select().from(schema.accounts).where(eq(schema.accounts.userId, userId)),
    db.select().from(schema.categories).where(eq(schema.categories.userId, userId)),
    db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.userId, userId)),
  ]);
  const accLookup = new Map(accounts.map((a) => [a.id, a.name]));
  const catLookup = new Map(categories.map((c) => [c.id, c]));

  const today = new Date().toISOString().slice(0, 10);

  if (format === "json") {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      user: { id: userId, email: session.user.email },
      accounts,
      categories,
      transactions,
    };
    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="asset-management-${today}.json"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const rows = [HEADERS.join(",")];
  for (const t of transactions) {
    const cat = t.categoryId ? catLookup.get(t.categoryId) : null;
    rows.push(
      [
        t.id,
        t.occurredAt.toISOString(),
        t.type,
        t.amount,
        t.currency,
        t.accountId ? accLookup.get(t.accountId) ?? "" : "",
        t.fromAccountId ? accLookup.get(t.fromAccountId) ?? "" : "",
        t.toAccountId ? accLookup.get(t.toAccountId) ?? "" : "",
        cat?.name ?? "",
        cat?.kind ?? "",
        t.tradeKind ?? "",
        t.ticker ?? "",
        t.quantity ?? "",
        t.pricePerUnit ?? "",
        t.fee ?? "",
        t.payee ?? "",
        t.memo ?? "",
        t.createdAt.toISOString(),
      ]
        .map(csvEscape)
        .join(",")
    );
  }
  // Excel-friendly: BOM so Korean chars render in Excel KR.
  const body = "﻿" + rows.join("\n");
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="asset-management-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
