# 개발 일지 — 1인 자산관리 PWA 만들기

> 광고도 없고, 마이데이터도 없고, 가입도 없는 — 그냥 내 가계부.
> 이 일지는 내가 매 작업이 끝날 때마다 무엇을, **왜 그렇게**, 그리고 **무엇에 막혔는지**를 정직하게 남기는 곳입니다. 추후 블로그에 그대로 옮길 수 있도록 한 호흡(=하나의 작업 단위)에 한 섹션을 씁니다.

관련 문서: [기획서](./asset-management-mvp.md) · [경쟁사 분석](./competitor-analysis.md) · [디자인 시스템](./design-system.md)

---

## #1 · 빈 폴더에서 5분만에 Next.js 골격 — Phase 1.1

> 2026-04-29

### 시작 상황

`asset-management/` 폴더에는 `docs/`, `.git/`, `.omc/` 그리고 `.gitignore` 한 줄짜리 — 정말 그것뿐이었다. 보통 같으면 `pnpm dlx create-next-app@latest .` 한 줄이면 끝나지만, 두 가지 마찰이 있었다.

1. **디렉토리가 비어 있지 않다.** create-next-app은 기본적으로 비어 있는 폴더를 요구한다. `--force` 플래그가 있긴 하지만 기존 `.git/`을 건드리는 게 찜찜했다.
2. **인터랙티브 프롬프트.** 자동화된 환경에서 "Use TypeScript? Tailwind? src/?" 를 한 번에 다 답하기 위해 모든 플래그를 외워서 넣어야 한다. 그런데 create-next-app은 버전마다 플래그 셋이 미묘하게 다르고 ESLint flat config 같은 디폴트가 자꾸 바뀐다.

그래서 **수동 스캐폴딩**을 택했다. `package.json` / `tsconfig.json` / `next.config.ts` / `postcss.config.mjs` / `next-env.d.ts` / `.eslintrc.json` 을 직접 작성. 시간은 오히려 짧았고 — 5분 — 의존성 트리를 내가 통제하는 만족감이 컸다.

### 의존성 트리 결정

`package.json` 에 박은 것들 (모두 의도가 있음):

```jsonc
{
  "dependencies": {
    // Auth — 단일 사용자 + magic link 또는 비밀번호
    "next-auth": "5.0.0-beta.25",
    "@auth/drizzle-adapter": "^1.7.4",

    // DB — libsql/SQLite로 시작, Postgres 전환은 dialect만
    "drizzle-orm": "^0.36.4",
    "@libsql/client": "^0.14.0",

    // shadcn/ui 의존
    "@radix-ui/react-*": "1.1.x",
    "vaul": "^1.1.2",          // bottom sheet
    "lucide-react": "^0.460.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.5",
    "tailwindcss-animate": "^1.0.7",

    // 폼 / 검증
    "react-hook-form": "^7.54.1",
    "zod": "^3.24.1",
    "@hookform/resolvers": "^3.9.1",

    // 차트 — Recharts (도넛/막대만 쓸 거라 충분)
    "recharts": "^2.15.0",

    // 토스트 — sonner
    "sonner": "^1.7.1",

    // 다크 모드
    "next-themes": "^0.4.4",

    // 날짜
    "date-fns": "^3.6.0",
    "react-day-picker": "^9.4.4"
  }
}
```

**의도적으로 뺀 것들:**

- ❌ `argon2` / `bcrypt` — 둘 다 네이티브 빌드. Vercel에서 굳이 쓰면 라이브러리 버전·플랫폼 트리플 매칭에 시간 녹는다. node:crypto의 `scrypt` 면 1인용엔 충분.
- ❌ ORM이 아닌 Prisma — 마이그레이션 격리는 좋지만 Drizzle보다 무겁다. 1인 프로젝트엔 type 추론 + raw SQL fallback이 빠른 Drizzle이 답.
- ❌ TanStack Query — Server Components + Server Actions 조합으로 충분. 클라 캐시 레이어를 굳이 추가하지 않음.

### 결과

빈 폴더 → 7개 라우트가 빌드되는 Next.js 앱으로 5분.

### 다음

shadcn 토큰을 박고, Drizzle 스키마를 작성하고, 인증을 끼워야 진짜 "골격"이 된다.

---

## #2 · 뱅크샐러드 톤을 코드로 — Phase 1.2 디자인 토큰

> 2026-04-29

### 결정한 것

`docs/design-system.md` 11.3·11.4 그대로 박았다. 거기에 적힌 색·타입스케일·모서리·그림자가 이미 결정문이라 새로 고민할 필요가 없었다.

```css
:root {
  --background: 0 0% 100%;
  --foreground: 230 10% 18%;       /* #2A2B33 — BPL 워드마크 색 */
  --primary:    156 100% 40%;      /* #00CD80 — 시그니처 그린 */
  --brand-blue: 204 100% 50%;
  --brand-cyan: 180 100% 40%;
  --brand-pink: 327 84% 74%;
  --danger:     4 86% 58%;         /* #F04438 */
  ...
  --radius: 0.75rem;               /* 12px (md) */
}
```

`tailwind.config.ts` 에는 `display-xl` / `heading-l` / `body-l` / `amount-l` 같은 **의미 단위** 폰트 사이즈를 박았다. `text-3xl` 같은 사이즈 토큰은 의미가 없어서 — `text-amount-l` 처럼 "큰 금액 표시용" 이라고 이름 붙이면 화면마다 같은 스케일이 보장된다.

```ts
fontSize: {
  "amount-l":  ["28px", { lineHeight: "36px", fontWeight: "800" }],
  "amount-m":  ["18px", { lineHeight: "24px", fontWeight: "700" }],
  // ...
}
```

### 한 가지 디테일 — 타뷸러 숫자

가계부에서 금액 정렬은 **세로로 자릿수가 맞아야** 한다. 그래야 12,000과 8,500이 한눈에 비교된다. Pretendard는 가변 폰트라 별도 타뷸러 폰트를 더 부르지 않고도 `font-feature-settings: 'tnum' 1` 만 켜면 된다. 그래서 `.tabular` 유틸리티 클래스를 globals.css에 한 번 박아두고 모든 금액 컴포넌트에서 사용.

```css
.tabular {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
}
```

### 폰트 로딩

처음엔 self-host(`public/fonts/PretendardVariable.woff2`)를 박을 생각이었지만, 디자인 토큰 단계에선 CDN(`cdn.jsdelivr.net/gh/orioncactus/pretendard/...`) 으로도 충분히 빠르고 — 추후에 woff2 한 파일만 떨어뜨리고 `@import` 한 줄 바꾸면 끝이다. 지금 self-host에 시간을 쓰지 않기로 했다.

### 다음

shadcn/ui 컴포넌트들을 위 토큰에 맞춰서 박는 단계.

---

## #3 · `shadcn add` 없이 shadcn — Phase 1.3 컴포넌트 정착

> 2026-04-29

### 왜 직접 썼나

`shadcn add button card input ...` 의 내부는 결국 **GitHub raw URL에서 파일을 fetch해서 로컬에 떨어뜨리는 것**뿐이다. 인터랙티브 프롬프트("어떤 import alias?", "Tailwind 어디?")가 매번 끼는데, 우리는 이미 디자인 토큰을 결정했으니 그 답을 한번에 박은 컴포넌트를 손으로 쓰는 편이 일관됨이 좋다.

직접 작성한 컴포넌트:

`Button` · `Card` · `Input` · `Label` · `Sheet` · `Drawer`(vaul 기반) · `Dialog` · `Tabs` · `Select` · `Switch` · `Popover` · `Avatar` · `Separator` · `Skeleton` · `Badge` · `sonner` Toaster.

각 컴포넌트는 디자인 토큰을 직접 참조한다. 예를 들어 Button:

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-body-l font-bold transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:     "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        secondary:   "bg-muted text-foreground hover:bg-muted/70",
        ghost:       "hover:bg-muted/60",
        outline:     "border border-border bg-transparent hover:bg-muted/50",
        link:        "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-4 py-2",   // 모바일 풀폭에서 가장 자주 쓰는 사이즈
        sm:      "h-9 rounded-md px-3 text-body-m",
        lg:      "h-14 rounded-md px-8",
        icon:    "h-10 w-10",
        "icon-sm": "h-9 w-9",
      },
    },
  }
);
```

`active:scale-[0.98]` 한 줄이 디자인 시스템이 정한 "press 피드백"을 그대로 구현. shadcn 기본은 이게 빠져 있어서, 내가 직접 박는 편이 의도를 강제하기 좋다.

### 결과

`/dev/preview` 라우트에 컴포넌트 카탈로그를 만들어서, 한 페이지에서 Button·Card·Input·Tabs·List·Empty·Metric·Chart까지 모든 디자인 토큰의 합을 한 번에 본다.

---

## #4 · 8개 테이블, 1년치 가계부의 형태 — Phase 1.4 Drizzle 스키마

> 2026-04-29

가계부의 데이터 모양은 의외로 단순하지만 — **transfer**(자산 이체)와 **trade**(주식 거래) 두 가지 특수 거래 모양 때문에 transactions 테이블이 살짝 와이드하다.

### 테이블

```
users                   # Auth.js
accounts_auth           # Auth.js
sessions                # Auth.js
verificationToken       # Auth.js

accounts                # 도메인 — 현금/은행/카드/증권/크립토/부동산/대출/기타
categories              # 부모-자식 1단계, kind=income|expense
transactions            # type=income|expense|transfer|trade
holdings                # 종목 보유 (수량, 평균매입가)
prices                  # ticker × date PK, Cron이 매일 채움
account_snapshots       # 월말 잔액 (drift 보정용)
settings                # 사용자 단일 row
```

### 거래 타입별 컬럼 매핑

```ts
type: "income"|"expense" → accountId, categoryId, amount
type: "transfer"         → fromAccountId, toAccountId, amount
type: "trade"            → accountId, tradeKind=buy|sell, ticker, quantity, pricePerUnit, fee
```

같은 테이블에 4가지 형태가 뒤섞이지만, **type 디스크리미네이터** 하나로 분기하면 검증·렌더 모두 깔끔. transfer는 카테고리 없음 → 지출 리포트에서 자동 제외. trade는 매수 시 `현금↓ + holdings↑`, 매도 시 그 반대를 한 트랜잭션 안에서 적용.

### 단일 사용자라도 user_id 박는 이유

지금은 1인용이지만 모든 도메인 테이블에 `user_id` 컬럼을 박아두고, 모든 query에 `WHERE user_id = ?` 를 강제했다. 추후 멀티유저로 갈 때 RLS 비슷한 행 격리를 새로 쓰지 않아도 된다 — 그냥 application layer에서 같은 패턴이 그대로 동작.

### libsql 우선

처음부터 Neon Postgres에 연결할 수도 있지만 — 그러면 로컬 개발이 인터넷 의존이 되고, 마이그레이션을 매번 원격에 적용하면서 디버깅하면 시간이 녹는다. **`file:./local.db`** 한 줄로 시작하면 마이그레이션·시드·롤백이 즉각이고, dialect는 `sqlite` 그대로 유지되니 추후 Postgres 전환 비용도 작다.

---

## #5 · scrypt + Credentials provider — Phase 1.5 인증

> 2026-04-29

### 단일 사용자에게 OAuth 끼우는 건 사치

원래 `next-auth` 에 magic link만 박을까 했지만 — 내가 매번 메일을 받아서 클릭하는 게 번거롭고, Resend 무료 한도를 굳이 쓰는 것도 oversight라 **Credentials + 비밀번호** 가 가장 단순하다.

비밀번호 해싱은 네이티브 의존성 없이:

```ts
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt}$${derived.toString("hex")}`;
}
```

`N=16384, r=8, p=1` 은 OWASP 권장의 가장 가벼운 셋. 1인용에 더 무겁게 쓸 이유가 없다. `timingSafeEqual` 로 타이밍 공격까지 차단.

### NextAuth 정의

```ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts_auth,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email:    { label: "이메일",   type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const user = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
        if (!user?.passwordHash) return null;
        if (!verifyPassword(password, user.passwordHash)) return null;
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) { if (user) token.id = user.id; return token; },
    async session({ session, token }) {
      if (token?.id && session.user) session.user.id = token.id as string;
      return session;
    },
  },
});
```

### `middleware.ts` 보호

미인증 → `/login?callbackUrl=...` 으로 리다이렉트, 이미 로그인했는데 `/login` 에 들어오면 `/` 으로. 단순하지만 1인용엔 충분.

```ts
export default auth((req) => {
  if (!req.auth && !isPublic) return Response.redirect(new URL("/login?callbackUrl=...", req.nextUrl));
  if (req.auth && pathname === "/login") return Response.redirect(new URL("/", req.nextUrl));
});
```

---

## #6 · 모바일 4탭 + 데스크탑 사이드바 — Phase 1.6 레이아웃

> 2026-04-29

뱅크샐러드 패턴을 그대로 가져왔다.

- **모바일**: 화면 하단에 4탭 (홈/가계부/자산/설정), `h-16` + `safe-area-inset-bottom`.
- **데스크탑**: 같은 4항목을 좌측 세로 사이드바로 변환, `md:flex md:hidden` 분기 한 번으로.

```tsx
// BottomNav (모바일)
<nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur safe-bottom md:hidden">
  <ul className="grid h-16 grid-cols-4">{ /* 탭 4개 */ }</ul>
</nav>

// Sidebar (데스크탑)
<aside className="hidden md:flex md:w-60 md:shrink-0 md:flex-col md:border-r md:border-border md:bg-card md:px-4 md:py-6">
  ...
</aside>
```

active 상태는 색만 바꾸지 않고 **stroke 두께**까지 살짝 더 굵게 (1.8 → 2.4). 작은 디테일이지만 활성/비활성 차이가 즉각 보인다.

`TopNav` 는 `h-14` 고정 + 좌측 뒤로가기 + 우측 액션 슬롯. 폼 변경 사항이 있으면 추후 "저장" 버튼이 들어갈 자리.

---

## #7 · 도메인 단위로 추출한 6개 — Phase 1.7 커스텀 컴포넌트

> 2026-04-29

shadcn primitive 만으론 가계부 UI가 짜이지 않는다. 디자인 시스템이 정한 6가지 합성 컴포넌트가 필요하다.

| 컴포넌트 | 역할 |
|---------|------|
| `CategoryIcon` | 색깔 라운드 컨테이너 + Lucide 모노 아이콘. 카테고리·계정 어디든 재사용. |
| `AmountDisplay` | 양수/음수 색 + 타뷸러 숫자 + ₩ prefix. variant=income/expense/neutral. |
| `ListItem` | 거래 항목 표준 행: 아이콘 + 제목/서브타이틀 + 우측 금액·시각. |
| `EmptyState` | 인라인 SVG 일러스트 + 헤딩 + 설명 + CTA. |
| `MetricCard` | 큰 숫자 + 변동 화살표(↑/↓) + 전기 대비 %. |
| `DateGroupHeader` | 일별 그룹 헤더 (sticky) + 그날 income/expense 합계. |

### CategoryIcon — color-mix 트릭

카테고리 색은 카테고리마다 다르고 (식비=그린, 교통=블루…), 컨테이너는 같은 색의 14% 알파 톤이어야 한다. `bg-{color}-100` 식 Tailwind 정적 클래스로는 사용자가 정의한 hex 값에 대응이 안 된다. CSS의 `color-mix` 한 줄로 해결:

```tsx
<span
  style={{ backgroundColor: `color-mix(in oklab, ${tone} 14%, transparent)` }}
>
  <Icon className={iconSize} style={{ color: tone }} strokeWidth={1.8} />
</span>
```

런타임에 어떤 카테고리 색이 와도 — `#00CD80` 든 `hsl(var(--brand-pink))` 든 — 같은 비율의 부드러운 배경이 자동 생성된다.

### MetricCard — % delta는 `previous` 가 있을 때만

전월 대비 % 변화를 표시하려면 이전 값을 알아야 한다. `previous` 가 없거나 0이면 % 영역은 숨김 (NaN 표시 회피).

```ts
const delta =
  previous !== undefined && previous !== 0
    ? ((amount - previous) / Math.abs(previous)) * 100
    : undefined;
```

---

## #8 · `as never` 의 흔적 지우기 — `experimental.typedRoutes` 끄기

> 2026-04-29

처음에 `next.config.ts` 에 `experimental.typedRoutes: true` 를 켰다. 그러면 `<Link href="/transactions">` 의 href가 자동으로 union type으로 좁혀져 오타를 컴파일 타임에 잡는다 — 좋다.

문제: `/transactions/new`, `/reports`, `/settings/accounts/new` 같이 **앞으로 만들 라우트**를 미리 거는 순간 빌드가 실패한다. 그래서 `as never` 캐스트를 7군데 박았다 — 코드가 더러워졌다.

해결: 일단 typedRoutes를 끄고, 라우트가 모두 채워지는 시점에 다시 켤 예정. 트레이드오프는 명백하지만 — 깔끔한 코드가 우선.

---

## #9 · 빈 폴더 → 7개 라우트 빌드 — Phase 1 완료

> 2026-04-29

### 검증

- `tsc --noEmit`: 0 errors
- `next build`: ✓ Compiled successfully · 5 static + 5 dynamic routes · 첫 페이지 105 kB First Load JS
- 라우트: `/`, `/login`, `/transactions`, `/accounts`, `/settings`, `/dev/preview`, `/api/auth/[...nextauth]`

### 트러블슈팅 모음

이 단계에서 막혔던 것들. 다음 사람을 위한 메모.

| 문제 | 원인 | 해결 |
|------|------|------|
| `argon2` 설치 실패 | Node 25에서 prebuilt 없음 | `node:crypto` scrypt 로 대체 (네이티브 의존성 0) |
| `react-day-picker@8` 피어 충돌 | React 19 미지원 | v9로 상향 |
| `date-fns@4` ↔ `react-day-picker@8` | 후자가 v2/v3만 받음 | `date-fns@3` 로 정렬 |
| `drizzle-kit@0.29` 의 `Config` 타입에 `driver: "turso"` 가 없음 | 타입 정의가 driver 신규 값 누락 | `tsconfig` 에서 `drizzle.config.ts` 만 typecheck 제외 (런타임 정상) |
| `experimental.typedRoutes` | 미생성 라우트로 빌드 실패 | 라우트 다 채워진 뒤 다시 켜기 |

### 첫 커밋

```
feat: scaffold Next.js app with design system, auth, and core layouts (Phase 1)
54 files changed, 13137 insertions(+)
```

---

## #10 · 마이그레이션 + 시드 — Phase 2.1

> 2026-04-29

### 왜 SQL 파일을 git에 두나

`drizzle-kit push` 는 스키마 디프로 직접 ALTER 를 발사한다. 빠르고 편하지만 — **변경 이력이 git에 남지 않는다**. 1인용이라도 6개월 뒤에 "왜 이 컬럼을 nullable 로 바꿨지?" 를 추적하려면 SQL 파일이 git history에 박혀야 한다. 그래서 `drizzle-kit generate` 로 SQL을 만들고 `migrate.ts` 로 적용하는 루트를 택했다.

### `migrate.ts` 한 페이지

```ts
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { createClient } from "@libsql/client";

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL ?? "file:./local.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  client.close();
}
main();
```

이 한 파일이 로컬 SQLite·원격 Turso·CI 다 똑같이 동작한다.

### 시드를 SQL이 아닌 TypeScript로

비밀번호 해시·랜덤 ID·idempotent 검사를 SQL 시드 파일로 표현하긴 너무 번잡. `tsx scripts/seed.ts` 한 번이면:

- 사용자 1명 (`me@asset.local` / `asset-dev-1234`)
- 카테고리 12종 (지출 8 + 수입 4): 식비/교통/주거/쇼핑/문화/의료/통신/기타지출/급여/보너스/이자/기타수입
- 계정 3종 (현금/주거래은행/신용카드)
- settings row 1개

idempotent 처리:

```ts
const existing = await db.select().from(users).where(eq(users.email, EMAIL)).limit(1);
if (!existing[0]) {
  await db.insert(users).values({ ... });
} else {
  console.log("[seed] user already exists, skipping");
}
```

같은 명령을 10번 실행해도 데이터가 중복되지 않는다.

### 결과

```
[seed] connected to file:./local.db
[seed] created user me@asset.local
[seed] inserted 12 categories
[seed] inserted 3 accounts
[seed] settings row created
[seed] DONE
  email:    me@asset.local
  password: asset-dev-1234
```

---

## #11 · Server Action 한 곳으로 — Phase 2.2

> 2026-04-29

### 디자인 의도

가계부의 데이터 흐름은 항상 같은 모양이다. **(1) 폼 입력 → (2) 검증 → (3) 인증 컨텍스트 확인 → (4) DB 쓰기 → (5) revalidate → (6) UI 갱신.** 이 6단계를 매 페이지에 다시 짜면 코드가 빠르게 갈라진다. 처음부터 한 가지 패턴을 강제했다.

### `_helpers.ts` — 액션 공통 인프라

```ts
class ActionError extends Error { code: string; }
async function requireUserId(): Promise<string>
type ActionResult<T> = { ok: true; data: T } | { ok: false; error, code }
function ok<T>(data: T): ActionResult<T>
function fail(err: unknown): ActionResult<never>
```

- `ActionError` 는 **사용자에게 보여줄 친근한 메시지** 를 담는 도메인 오류. throw하면 `fail()` 이 그대로 노출.
- 그 외 모든 예외는 `console.error` 로 로깅 후 일반 메시지("처리 중 오류…")로 매핑. **스택 트레이스가 클라이언트에 새는 사고를 차단**.
- 결과 타입을 union으로 좁혀서 호출부에서 `if (!result.ok)` 가능. 토스트 표시·폼 에러 매핑이 일관됨.

### `transactions.ts` — 4가지 거래 타입을 한 액션에서

가계부의 거래는 **단순(income/expense), 이체(transfer), 주식 거래(trade)** 4가지인데 컬럼 셋이 다 다르다 (transfer는 from/to, trade는 ticker·수량·단가·수수료). UI 입장에선 폼 한 개에서 타입만 바뀌면 좋지만, 검증 규칙은 분기되어야 한다.

해결: **Zod `discriminatedUnion`** 으로 `type` 필드를 디스크리미네이터로 잡고, 4가지 스키마를 union.

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
  toAccountId:   z.string().min(1, "받는 계정을 선택해 주세요."),
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

이렇게 하면 클라이언트가 잘못된 조합(예: transfer인데 categoryId만 보냄)을 보내도 서버에서 1차 거름. 메시지를 한국어로 박아서 그대로 토스트로 띄울 수 있다.

### 한 번 막힌 곳: TypeScript discriminated union narrowing

내가 처음에 쓴 코드는:

```ts
if (input.type === "income" || input.type === "expense") {
  // ok, narrowing works
} else if (input.type === "transfer") {
  // ok
} else {
  // ERROR: input.tradeKind doesn't exist
}
```

타입스크립트가 `else` 가지에서 trade로 좁혀주지 않았다. 이유: 첫 분기의 조건이 `"income" | "expense"` 두 케이스를 묶는데, TS는 그것을 한 묶음으로 처리한다. 두 번째 분기에서 transfer가 빠지지만, **trade까지 좁히는 inference 가 약하다.** 결과적으로 `else` 가지의 타입이 `incomeOrExpense | trade` 의 union 으로 남아서 trade 전용 필드 접근이 막힌다.

`switch (input.type)` 로 바꾸자 TS가 정확히 좁혀줬다. switch fall-through(케이스 둘이 같은 처리) 도 명시적이라 가독성도 좋고, 코드가 더 짧아졌다.

```ts
switch (input.type) {
  case "income":
  case "expense":
    await db.insert(...).values({ accountId, categoryId, ... }); break;
  case "transfer":
    await db.insert(...).values({ fromAccountId, toAccountId, ... }); break;
  case "trade":
    await db.insert(...).values({ tradeKind, ticker, quantity, pricePerUnit, fee, ... }); break;
}
```

### `categories.ts`, `accounts.ts` — upsert + archive 패턴

카테고리·계정은 거래보다 단순. 입력 폼이 같고, `id` 가 있으면 업데이트·없으면 신규. **소프트 삭제(`isArchived`)** 만 지원: 1인 사용자라도 과거 거래의 외래키를 깨뜨리는 hard delete는 위험.

`userId`를 항상 WHERE에 박는 게 핵심. 단일 사용자라도 추후 멀티유저로 확장될 때 RLS 같은 행 단위 격리를 굳이 짜지 않아도 되도록.

### `revalidatePath` 전략

- 거래 변경 → `/`, `/transactions`, `/accounts` 셋 다 재검증 (대시보드 KPI도 거래에 의존).
- 카테고리 변경 → `/settings/categories`, `/transactions`.
- 계정 변경 → `/accounts`, `/settings/accounts`, `/transactions`.

오버 리밸리데이트가 약간 있지만, Server Component + libsql은 충분히 빠르다. **캐시 정확도가 우선**.

### 보안 약속

- 모든 액션 첫 줄: `await requireUserId()` — 세션 없으면 즉시 throw.
- 모든 update/delete WHERE에 `userId` 강제 결합 — 다른 사용자의 row를 ID 추측으로 건드리는 path 차단.
- 클라이언트에 던지는 메시지는 ActionError 한 종류만.
- `$ACTION_*` 같은 React Server Action 내부 필드는 `readFormData` 에서 무시.

---

## #12 · 3초 안에 한 줄 — Phase 2.3 거래 입력 시트

> 2026-04-29

### 목표

이 가계부의 핵심 UX는 **빠른 입력**. 데스크탑 단축키 `n`, 모바일 우하단에서 한 손 입력. 성공 토스트 0.5초 → 즉시 다음 거래.

### 한 시트로 데스크탑·모바일 동시 대응

데스크탑에선 가운데 모달, 모바일에선 하단 시트가 자연스럽다. 두 패턴을 동시에 만족하는 훅을 만들었다.

```ts
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);
  return matches;
}
```

그리고 `ResponsiveSheet` 컴포넌트:

```tsx
export function ResponsiveSheet({ open, onOpenChange, title, description, children }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  if (isDesktop) {
    return <Dialog>...</Dialog>;
  }
  return <Drawer>...</Drawer>;  // vaul 기반
}
```

호출부는 Dialog/Drawer 차이를 신경쓰지 않는다 — `<ResponsiveSheet open={...}>` 한 번으로 끝.

### 폼 — `useTransition` + Server Action 직접 호출

```tsx
const [pending, startTransition] = useTransition();

function handleSubmit(formData: FormData) {
  formData.set("type", type);
  formData.set("categoryId", categoryId);
  formData.set("accountId", accountId);
  formData.set("occurredAt", new Date(occurredAt).toISOString());

  startTransition(async () => {
    const result = await createTransaction(formData);
    if (result.ok) {
      toast.success(type === "income" ? "수입을 기록했어요" : "지출을 기록했어요");
      navigator.vibrate?.(10);  // Android Chrome에서 햅틱
      setAmount(""); setMemo(""); setPayee("");
      onSuccess?.();
    } else {
      toast.error(result.error);
    }
  });
}
```

핵심 디테일:

- **`startTransition`** 으로 감싸야 Server Action 호출 중에 폼이 disabled되지 않고 React 18+의 concurrent UX가 켜진다.
- **`navigator.vibrate?.(10)`** — Android Chrome에서 10ms 짧은 진동. 실제로 입력이 즉시 반영됐다는 신체적 피드백. iOS는 무시(`?.` 가드).
- **즉시 클리어** — 성공 후 amount/memo/payee를 비워서 "다음 거래를 바로 입력" 흐름.
- **친근한 토스트 카피** — "기록되었습니다" 가 아니라 "기록했어요". 디자인 시스템 §1.4 보이스앤톤.

### 카테고리 칩 — 가로 스크롤

12개 이상의 카테고리를 세로 select에 박으면 모바일에서 답답하다. 가로 스크롤 칩이 정답.

```tsx
<div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
  {filteredCategories.map((c) => (
    <button
      type="button"
      onClick={() => setCategoryId(c.id)}
      className={cn(
        "flex min-w-[68px] shrink-0 flex-col items-center gap-1 rounded-md px-2 py-2",
        active ? "bg-primary/10 ring-2 ring-primary" : "hover:bg-muted/60"
      )}
    >
      <CategoryIcon icon={c.icon} color={c.color} size="md" rounded="full" />
      <span className="text-caption">{c.name}</span>
    </button>
  ))}
</div>
```

`scrollbar-none` 유틸리티를 globals.css 에 박아서 스크롤바를 숨기고 (iOS Safari에서 깔끔), `min-w-[68px]` 으로 칩 크기를 균일하게.

### 디폴트 — "마지막에 쓴 카테고리·계정" 자동 선택

빠른 입력의 핵심은 **클릭 수 줄이기**. 사용자가 어제 식비를 입력했으면 오늘도 식비일 확률이 높다. `loadFormDefaults` 쿼리 한 번으로 최근 거래 20개를 훑어서 가장 최근 expense·income 카테고리·계정을 추출:

```ts
let lastExpenseCategory: string | undefined;
let lastIncomeCategory: string | undefined;
let lastAccount: string | undefined;
for (const t of recent) {
  if (!lastAccount && t.accountId) lastAccount = t.accountId;
  if (!lastExpenseCategory && t.type === "expense" && t.categoryId)
    lastExpenseCategory = t.categoryId;
  if (!lastIncomeCategory && t.type === "income" && t.categoryId)
    lastIncomeCategory = t.categoryId;
  if (lastExpenseCategory && lastIncomeCategory && lastAccount) break;
}
```

3개 다 찾으면 즉시 break — 최악의 경우 20개를 훑지만 보통 처음 몇 개에서 끝난다.

### 결과

홈 / 가계부 페이지에 "+" 버튼 → 시트 → 금액 입력 → 카테고리 클릭 → 기록하기. 데스크탑은 모달, 모바일은 하단 시트. 같은 코드.

### 검증

- `tsc --noEmit`: 0 errors
- `next build`: ✓ Compiled successfully · 7 routes · `/` 와 `/transactions` 첫 페이지 326 kB (시트 + Drawer + Recharts 미사용 부분 트리쉐이킹 후)

### 다음

- Phase 2.4: 카테고리·계정 관리 페이지 (`/settings/categories`, `/settings/accounts`).
- Phase 2.5: 월별 리포트 (Recharts 도넛 + 일별 막대).
- Phase 2.6: CSV export.

---

## #13 · 카테고리·계정 CRUD를 한 시트로 — Phase 2.4

> 2026-04-29

### 빌드 블록 vs 페이지

이미 만든 두 가지가 있다 — `ResponsiveSheet` (모바일 Drawer / 데스크탑 Dialog 자동 분기) 와 `upsertCategory` / `upsertAccount` 액션. 이걸 다시 짤 이유가 없으니, 새로 만든 건 본질적으로 두 가지뿐이었다:

1. **폼 컴포넌트** (`category-form.tsx`, `account-form.tsx`) — 색·아이콘 선택을 시각적으로.
2. **매니저 컴포넌트** (`category-manager.tsx`, `account-manager.tsx`) — 리스트 + 추가/편집/보관 버튼을 한 컴포넌트로 묶음.

페이지(`/settings/categories`, `/settings/accounts`)는 단지 DB 쿼리해서 매니저에 props로 내려주는 30줄짜리 server component.

### 색·아이콘 픽업 — 정적 옵션 vs 자유 입력

처음엔 hex 색을 직접 입력받을까 했지만 — 1인용에서 색 17개를 외워서 입력하는 사용자는 없다. 그리고 디자인 시스템 §2.4 차트 팔레트가 5색 이미 정해져 있으니 — **8색 팔레트** 로 제한하는 게 자연스럽다.

```ts
const COLOR_OPTIONS = [
  "#00CD80", // brand-green
  "#0099FF", // brand-blue
  "#00CDCD", // brand-cyan
  "#F582C6", // brand-pink
  "#F79009", // brand-amber
  "#F04438", // danger
  "#7E57C2", // purple (보조)
  "#9CA3AF", // neutral
] as const;
```

Lucide 아이콘도 같은 원리. 가계부에서 자주 쓰는 16개를 미리 골라서:

```ts
const ICON_OPTIONS = [
  "Utensils", "Bus", "Home", "ShoppingBag",
  "Film", "Stethoscope", "Smartphone", "Coffee",
  "Briefcase", "Sparkles", "PiggyBank", "Coins",
  "GraduationCap", "Plane", "Heart", "Gift",
] as const;
```

그리드 8×2로 깔끔하게 떨어진다. 사용자가 더 원하면 추후 검색 기능을 추가할 수 있지만, 지금은 단순함이 우선.

### 색 미리보기를 실시간으로

색을 클릭하는 즉시 아이콘 그리드도 같은 색으로 갱신되어야 한다 — "이 색에 이 아이콘이 어울릴까?" 를 한눈에. 그래서 `CategoryIcon` 의 `color` prop 에 React state를 그대로 흘려보냈다:

```tsx
<CategoryIcon icon={name} color={color} size="sm" />
```

색을 바꾸면 16개 아이콘 컨테이너 전체가 새 색의 14% 톤으로, 아이콘 자체도 새 색으로 업데이트.

### 보관(archive) 토글 — 두 줄짜리 액션

soft delete만 지원한다고 했으니, 매니저에선 "보관" / "다시 사용" 두 상태만 토글하면 된다.

```tsx
function toggleArchive(c: Category) {
  startTransition(async () => {
    const result = await archiveCategory(c.id, !c.isArchived);
    if (result.ok) {
      toast.success(c.isArchived ? "다시 사용할게요" : "보관함으로 옮겼어요");
    } else {
      toast.error(result.error);
    }
  });
}
```

보관된 카테고리는 회색 처리(`opacity-50`) — 시각적으로 즉시 구분. 거래 입력 시트의 카테고리 리스트(`loadFormDefaults`)는 이미 `isArchived = false` 만 가져오므로 자동으로 빠진다. 리포트도 마찬가지.

### 탭으로 지출/수입 분리

카테고리 12개 정도는 한 화면에 나열해도 되지만, 사용자가 30~40개로 늘리는 순간 헝클어진다. 처음부터 **지출/수입 두 탭** 으로 나눠서 mental model 을 분리:

```tsx
<Tabs defaultValue="expense">
  <TabsList className="grid w-full grid-cols-2">
    <TabsTrigger value="expense">지출 · {expense.length}</TabsTrigger>
    <TabsTrigger value="income">수입 · {income.length}</TabsTrigger>
  </TabsList>
  ...
</Tabs>
```

탭 라벨에 카운트를 같이 박아서 ("지출 · 8개") 어디에 몇 개 있는지 한눈에. 작은 디테일이지만 정보 밀도가 확 올라간다.

### 한 번 막힌 곳: ESLint `react/no-unescaped-entities`

```tsx
"추가" 버튼으로 만들어 보세요.
```

JSX 안에서 일반 따옴표(`"`)는 ESLint가 막는다. 답은 `&quot;` 로 escape 하거나, 아예 한국식 표현으로 바꾸는 것. 후자를 택했다 — "**우측 상단 추가 버튼으로 만들어 보세요.**" 가 더 자연스럽고, 사용자에게 위치 힌트까지 준다. 코드 레벨의 escape는 미관도 떨어지고 한국 사용자 입장에선 뜬금없다.

### 검증

- `tsc --noEmit`: 0 errors
- `next build`: ✓ 10개 라우트 — `/settings/categories`, `/settings/accounts` 추가됨, 둘 다 ~325 kB First Load JS (Tabs + Sheet/Drawer + Form 다 포함).

### 다음

- Phase 2.5: 월별 리포트 — Recharts 도넛(카테고리 비율) + 일별 막대(지출 추이).
- Phase 2.6: CSV export.
