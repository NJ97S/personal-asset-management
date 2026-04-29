# 개발 일지

이 파일은 작업 단위가 끝날 때마다 무엇을 했고, 왜 그렇게 했고, 다음에 무엇을 할지를 짧게 남기는 곳입니다.
관련 기획 문서: [asset-management-mvp.md](./asset-management-mvp.md), [design-system.md](./design-system.md), [competitor-analysis.md](./competitor-analysis.md)

---

## 2026-04-29 — Phase 1 기반 스캐폴딩

### 무엇을

- Next.js 15 (App Router) + TypeScript strict + Tailwind 3.4 프로젝트를 수동 스캐폴딩.
  - `pnpm dlx create-next-app`이 아닌 직접 `package.json`/`tsconfig.json`/`next.config.ts`/`postcss.config.mjs`를 작성. 이유: 작업 디렉토리가 비어 있지 않고(`docs/`, `.git/`), 인터랙티브 프롬프트를 우회하기 위함.
- 디자인 시스템 토큰을 `tailwind.config.ts` + `src/app/globals.css`에 적용.
  - 컬러(brand-green/blue/cyan/pink/amber + 시멘틱), 타입스케일(display/heading/body/amount/caption), 모서리(6/12/16/20/full), 그림자(soft/pop), Pretendard 폰트(CDN로딩, 추후 self-host 전환).
  - light/dark 두 토큰 셋 모두 작성 (design-system.md §11.3 그대로).
- shadcn/ui 핵심 컴포넌트를 직접 작성 (CLI 인터랙티브 회피): `Button`, `Card`, `Input`, `Label`, `Sheet`, `Drawer`(vaul), `Dialog`, `Tabs`, `Select`, `Switch`, `Popover`, `Avatar`, `Separator`, `Skeleton`, `Badge`, `sonner` Toaster.
- Drizzle ORM 스키마(`src/db/schema.ts`)에 MVP 8개 테이블 정의: `users`, `accounts_auth`, `sessions`, `verificationTokens` (Auth.js용), `accounts`, `categories`, `transactions`, `holdings`, `prices`, `account_snapshots`, `settings`.
  - SQLite(libsql) 기반으로 시작 → 추후 Neon Postgres 전환 시 dialect만 갈아끼우면 되도록 컬럼 타입은 `real`/`integer`/`text` 단순 매핑 유지.
- Auth.js v5 (next-auth beta) Credentials provider + DrizzleAdapter + node:crypto scrypt 비밀번호. argon2 같은 네이티브 의존성 회피.
- `(app)` route group 레이아웃: 데스크탑 사이드바 / 모바일 BottomNav (홈·가계부·자산·설정 4탭) / `TopNav` 컴포넌트.
- 도메인 컴포넌트 6개: `CategoryIcon`, `AmountDisplay`, `ListItem`, `EmptyState`, `MetricCard`, `DateGroupHeader` (design-system.md §11.2).
- 페이지 골격: `/login`, `/(app)/page` (홈 KPI + 최근 거래), `/(app)/transactions` (일별 그룹 헤더 리스트), `/(app)/accounts`, `/(app)/settings`, `/(app)/dev/preview` (컴포넌트 카탈로그).
- `middleware.ts`로 미인증 → `/login` 리다이렉트 보호.

### 왜 그렇게

- **수동 스캐폴딩**: 빈 디렉토리 요구, 인터랙티브 프롬프트, 그리고 정확히 원하는 의존성 셋만 넣기 위해. CLI는 부수효과(eslint flat config, src 옵션 분기 등)가 많다.
- **shadcn 직접 작성**: `shadcn add` CLI가 인터랙티브이며 사용자 승인 입력을 받음. 수동 작성으로 디자인 토큰을 곧바로 박는 편이 일관됨.
- **단일 사용자 + scrypt**: 네이티브 빌드 의존성 0. 1인 사용자라 비밀번호 저장 비용은 충분.
- **SQLite 우선**: Vercel + Neon 셋업이 끝나기 전에도 로컬에서 즉시 돌리려면 libsql이 가장 마찰이 적음. Drizzle dialect를 그대로 둔 채 driver만 교체 가능.

### 트러블슈팅

- `argon2` → 네이티브 빌드 실패 위험. `node:crypto` `scrypt`로 대체.
- `react-day-picker@8` 은 React 19 미지원 → v9로 상향.
- `date-fns@4` ↔ `react-day-picker@8` 피어 충돌 → `date-fns@3`으로 정렬.
- `drizzle-kit@0.29` 의 `Config` 타입이 `driver: "turso"` 를 모름 → `tsconfig`에서 `drizzle.config.ts`만 typecheck 제외 (런타임은 정상).
- `next.config.ts`의 `experimental.typedRoutes` → 아직 존재하지 않는 라우트(`/transactions/new` 등)에서 컴파일 실패. 라우트가 늘면 다시 켤 예정. 지금은 끔.

### 검증

- `node_modules/.bin/tsc --noEmit` — 0 errors.
- `node_modules/.bin/next build` — 5개 라우트 빌드 성공 (`/`, `/accounts`, `/transactions`, `/settings`, `/login`, `/dev/preview`, `/api/auth/[...nextauth]`).

### 다음

- Phase 2 (M1): 거래 입력 폼(Server Action), 카테고리/계정 CRUD, 월별 리포트 차트.
- 데모용 거래 데이터 생성 헬퍼 (개발 편의).

---

## 2026-04-29 — Phase 2.1 DB 마이그레이션 + 시드

### 무엇을

- `drizzle-kit generate` 으로 첫 마이그레이션 SQL 생성 (`drizzle/0000_*.sql`, 11개 테이블).
- `scripts/migrate.ts`: libsql migrator로 로컬 SQLite(`./local.db`)에 마이그레이션 적용.
- `scripts/seed.ts`: 기본 사용자(`me@asset.local` / `asset-dev-1234`), 카테고리 12종(식비/교통/주거/쇼핑/문화/의료/통신/기타지출 + 급여/보너스/이자/기타수입), 기본 계정 3종(현금/주거래은행/신용카드), 빈 settings row까지 한 번에 삽입.
- 의존성 추가: `nanoid` (ID), `tsx` (스크립트 실행).
- npm 스크립트: `db:generate`, `db:migrate`, `db:push`, `db:studio`, `db:seed`.

### 왜 그렇게

- **drizzle-kit migrator vs push**: 1인 프로젝트지만 SQL 마이그레이션 파일을 git에 보관하면 추후 Postgres 전환·리뷰가 쉽다. 일관된 히스토리 우선.
- **시드를 코드로**: `.sql` 시드 파일은 비밀번호 해시·랜덤 ID 생성에 부적합. tsx 한 파일이 가장 단순.
- **idempotent seed**: 같은 명령을 여러 번 돌려도 안전 (사용자/카테고리/계정 존재 여부 검사 후 skip).

### 검증

- `npm run db:migrate` → `[migrate] done` (file:./local.db).
- `npm run db:seed` → user/12 categories/3 accounts/settings 삽입.
- `tsc --noEmit` 통과.

### 다음

- Phase 2.2: 거래/카테고리/계정 Server Actions (Zod + auth guard).
- Phase 2.3: 거래 입력 시트 (Drawer/Dialog).

---

## 2026-04-29 — Phase 2.2 Server Actions: 거래/카테고리/계정

> 한 줄 요약: 모든 mutate 경로를 `"use server"` 액션 한 곳으로 모았다. Zod 스키마로 입력을 정상화하고, 인증 가드와 표준 에러 응답을 헬퍼로 빼서 페이지·폼 어디서든 같은 약속으로 호출하게 만들었다.

### 디자인 의도

가계부의 데이터 흐름은 항상 같은 모양이다. **(1) 폼 입력 → (2) 검증 → (3) 인증 컨텍스트 확인 → (4) DB 쓰기 → (5) revalidate → (6) UI 갱신.** 이 6단계를 매 페이지에 다시 짜면 코드가 빠르게 갈라진다. 그래서 처음부터 한 가지 패턴을 강제했다.

#### `_helpers.ts` — 액션 공통 인프라

```ts
class ActionError extends Error { code: string; ... }
async function requireUserId(): Promise<string>
type ActionResult<T> = { ok: true; data: T } | { ok: false; error, code }
function ok<T>(data: T): ActionResult<T>
function fail(err: unknown): ActionResult<never>
```

- **`ActionError`** 는 사용자에게 보여줄 친근한 메시지를 담는 도메인 오류. throw하면 `fail()`이 그대로 노출.
- 그 외 모든 예외는 콘솔에 로깅 후 일반 메시지("처리 중 오류…")로 매핑. 스택 트레이스가 클라이언트에 새는 사고를 차단.
- 결과 타입을 union으로 좁혀서, 호출부에서 `if (!result.ok)` 로 좁힐 수 있게 했다. 토스트 표시·폼 에러 매핑이 일관됨.

#### `transactions.ts` — 4가지 거래 타입을 한 액션에서

가계부의 거래는 **단순(income/expense), 이체(transfer), 주식 거래(trade)** 4가지인데, 컬럼 셋이 서로 다르다(transfer는 from/to, trade는 ticker·수량·단가·수수료). UI 입장에선 폼 한 개에서 타입만 바뀌면 좋지만, 검증 규칙은 분기되어야 한다.

해결: **Zod `discriminatedUnion`** 으로 `type` 필드를 디스크리미네이터로 잡고, 4가지 스키마(income/expense는 같은 모양 → 1개로 합침)를 union.

```ts
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
  ticker: z.string().min(1),
  quantity: z.coerce.number().positive(),
  pricePerUnit: z.coerce.number().positive(),
  fee: z.coerce.number().min(0).default(0),
  accountId: z.string().min(1),
  ...baseFields,
});

const createTxSchema = z.discriminatedUnion("type", [
  incomeOrExpenseSchema,
  transferSchema,
  tradeSchema,
]);
```

이렇게 하면 클라이언트에서 잘못된 조합(예: transfer인데 categoryId만 보냄)이 와도 서버에서 1차 거름. 메시지를 한국어로 박아서 그대로 토스트로 띄울 수 있다.

#### 한 번 막힌 곳: TypeScript discriminated union narrowing

내가 처음에 쓴 코드는 다음과 같았다:

```ts
if (input.type === "income" || input.type === "expense") {
  // ok
} else if (input.type === "transfer") {
  // ok
} else {
  // here, ts says input.tradeKind doesn't exist
}
```

타입스크립트가 `else` 가지에서 trade로 좁혀주지 않았다. 이유: 첫 분기의 조건이 `"income" | "expense"` 두 케이스를 묶는데, TS는 union을 좁힐 때 *각각*을 빼지 않고 한 묶음으로 본다. 두 번째 분기에서 transfer가 빠지긴 하지만, **이미 첫 분기에서 `incomeOrExpenseSchema` 의 결과 타입이 줄어들지 않은 상태로 남는 케이스**가 있다 (양쪽 다 같은 obj 모양인데 type 리터럴만 다른 두 객체 union이라).

`switch (input.type) { case "income": case "expense": ... break; case "transfer": ... case "trade": ... }` 으로 바꾸자 TS가 정확히 좁혀줬다. switch fall-through(케이스 둘이 같은 처리)도 명시적이라 가독성도 좋다. 결과적으로 코드가 더 짧아졌다.

#### `categories.ts`, `accounts.ts` — upsert + archive 패턴

카테고리·계정은 거래보다 단순하다. 입력 폼이 같고, `id` 가 있으면 업데이트, 없으면 신규. **소프트 삭제 (`isArchived`)** 만 지원: 1인 사용자라도 과거 거래의 외래키를 깨뜨리는 hard delete는 risk가 너무 크다.

```ts
export async function archiveCategory(id: string, archived = true) {
  const userId = await requireUserId();
  await db.update(schema.categories)
    .set({ isArchived: archived })
    .where(and(
      eq(schema.categories.id, id),
      eq(schema.categories.userId, userId),
    ));
  ...
}
```

`userId`를 항상 WHERE에 박는 게 핵심. 단일 사용자라도 추후 멀티유저로 확장될 때 RLS 같은 행 단위 격리를 굳이 짜지 않아도 되도록.

#### `revalidatePath` 전략

- 거래 변경 → `/`, `/transactions`, `/accounts` 셋 다 재검증 (대시보드 KPI도 거래에 의존하니까).
- 카테고리 변경 → `/settings/categories`, `/transactions` (카테고리 라벨이 거래 목록에 표시).
- 계정 변경 → `/accounts`, `/settings/accounts`, `/transactions`.

오버 리밸리데이트가 약간 있긴 한데, Server Component + libsql은 충분히 빠르다. 캐시 정확도가 우선.

### 보안 고려

- 모든 액션 첫 줄: `await requireUserId()` — 세션 없으면 즉시 throw.
- 모든 update/delete WHERE에 `userId` 강제 결합 — 다른 사용자의 row를 ID 추측으로 건드리는 path 차단.
- 클라이언트에 던지는 메시지는 ActionError 한 종류만. 그 외 예외는 `console.error` + 일반 메시지.
- `$ACTION_*` 같은 React Server Action 내부 필드는 `readFormData` 에서 무시.

### 검증

- `tsc --noEmit` 통과.
- 직접 호출 시뮬레이션은 다음 단계(폼 UI)에서 통합으로 검증 예정.

### 다음

- Phase 2.3: 거래 입력 시트 — 모바일 Drawer / 데스크탑 Dialog. `useFormState` + `createTransaction` 연결.
- 빠른 입력 UX: 가장 최근 사용 카테고리·계정 자동 선택, 메모 자동완성(추후).

