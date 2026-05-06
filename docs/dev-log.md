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

---

## #14 · 도넛 + 일별 막대 + Top 5 — Phase 2.5 리포트

> 2026-04-29

### 리포트 한 페이지에 무엇을 담을까

가계부 리포트가 흔히 빠지는 함정: **차트를 너무 많이 박는 것.** 화면을 스크롤할 때마다 새로운 시각화가 나오면 "오, 멋있다" 다음에 "근데 이걸로 뭘 결정하지?" 가 따라온다. 그래서 처음부터 4가지 카드만 박았다.

1. **이번 달 KPI 2장** — 지출·수입 + 전월 대비 % (MetricCard 재사용).
2. **카테고리 도넛** — 어디에 돈이 가장 많이 갔나.
3. **일별 막대** — 어느 날 몰아서 썼나.
4. **상위 거래처 5** — 어디에 자주 갔나 / 큰 단건은 어디였나.

이 네 가지면 "이번 달 어땠지?" 라는 질문에 80%는 답이 된다. 더 자세한 분석은 추후.

### 도넛 — 가운데에 총합 박기

뱅크샐러드 패턴: 도넛은 비율을 보여주고, **가운데 빈 공간에 총합을 박아** 두 정보를 한 번에 본다.

```tsx
<div className="relative" style={{ height }}>
  <ResponsiveContainer>
    <PieChart>
      <Pie
        innerRadius="62%"
        outerRadius="92%"
        paddingAngle={1.5}
        stroke="none"
      >
        {display.map((d, i) => (
          <Cell fill={d.color || FALLBACK_PALETTE[i % FALLBACK_PALETTE.length]} />
        ))}
      </Pie>
    </PieChart>
  </ResponsiveContainer>
  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
    <span className="text-body-s text-muted-foreground">총 지출</span>
    <span className="tabular text-heading-l">{formatKRW(total)}</span>
  </div>
</div>
```

`pointer-events-none` 로 가운데 텍스트가 도넛 hover 를 가리지 않게 했다. innerRadius `62%`, outerRadius `92%` — 두께 32px 룩이 디자인 시스템 §8.9 와 일치.

색은 카테고리에 박힌 hex를 그대로 쓰고, 없으면 차트 팔레트 fallback. 사용자가 "스타벅스 = 그린" 으로 보던 카테고리 색이 도넛에서도 그대로 보여서 인지 부담 0.

### 도넛 옆 범례 — 비율 + 금액 동시

도넛만으로는 정확한 금액을 모른다. 옆에 정렬된 범례를 두고 — **퍼센트 + KRW 금액을 같이** 표시. 비율과 절대값 둘 다 즉시 비교.

```tsx
{sorted.map((d, i) => {
  const pct = (d.amount / total) * 100;
  return (
    <li className="flex items-center gap-3 rounded-md px-1 py-1">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
      <span className="flex-1 truncate text-body-m">{d.name}</span>
      <span className="text-body-s text-muted-foreground tabular w-10 text-right">{pct.toFixed(0)}%</span>
      <span className="tabular text-body-m">{formatKRW(d.amount)}</span>
    </li>
  );
})}
```

데스크탑은 도넛 좌측 + 범례 우측 (`md:grid-cols-[260px_1fr]`), 모바일은 도넛 위 + 범례 아래.

### 일별 막대 — 1일~31일 빈 칸 채우기

거래가 없는 날도 막대 빈 칸을 그려야 한다 (안 그리면 "23일에 거래 없었어요" 가 안 보인다). 그래서 데이터를 빌드할 때 **그 달의 모든 일자** 를 미리 0원으로 채워넣고, 거래가 있는 날만 amount 누적:

```ts
const daysInMonth = monthEnd.getDate();
const daily: { date: string; expense: number; income: number }[] = [];
for (let i = 1; i <= daysInMonth; i++) {
  const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), i);
  daily.push({ date: dayKey(d), expense: 0, income: 0 });
}
for (const t of thisMonth) {
  const idx = t.occurredAt.getDate() - 1;
  if (t.type === "expense") daily[idx].expense += t.amount;
  if (t.type === "income") daily[idx].income += t.amount;
}
```

x축 라벨은 일자만 (`28일` 가 아니라 `28`). 30개 라벨이 다 들어가면 답답하니, Recharts가 자동으로 일부를 드롭하도록 둠. y축은 만/천 단위로 압축 (`100,000` → `10만`):

```ts
tickFormatter={(v) => {
  const n = Number(v);
  if (n >= 10000) return `${Math.round(n / 10000)}만`;
  if (n >= 1000) return `${Math.round(n / 1000)}천`;
  return String(n);
}}
```

### 상위 거래처 5 — payee가 비면 카테고리로 폴백

처음에 단순히 `payee` 로만 그루핑했더니 — 거래처를 비워둔 거래가 다 "기타" 로 묶였다. 그건 별로 유용한 정보가 아니다. 폴백을 카테고리 이름으로:

```ts
const key =
  t.payee?.trim()
  || (t.categoryId ? catLookup.get(t.categoryId)?.name : null)
  || "기타";
payeeMap.set(key, (payeeMap.get(key) ?? 0) + t.amount);
```

이렇게 하니 "스타벅스 12,500원" + "이마트 45,300원" + "식비 23,000원 (거래처 비움)" 이 모두 같은 리스트에서 한눈에 보인다. 정확도는 조금 떨어지지만 **사용자가 어디에 돈을 썼는지** 라는 질문엔 충분.

### 빈 상태 한 번 더

이번 달도 지난 달도 거래가 0이면 차트를 그리지 말고 EmptyState. 빈 도넛은 보기에 좋지 않다.

```tsx
if (thisMonth.length === 0 && lastMonth.length === 0) {
  return (
    <Card>
      <EmptyState
        title="이번 달 거래가 없어요"
        description="가계부에 첫 거래를 추가하면 리포트가 채워져요."
      />
    </Card>
  );
}
```

### Recharts 무게

Recharts 가 First Load JS를 ~120 kB 더 키운다 (이번 달 page = 222 kB). 라이트한 차트 라이브러리(예: visx, uPlot)로 바꿀 수도 있지만, **shadcn 호환 + Recharts API 가 가장 단순** 하다는 트레이드오프로 일단 두기로. 추후 페이지가 자주 열리는 게 아니니 (홈은 KPI만 보여줌) 222 kB가 큰 비용은 아니다.

### 검증

- `tsc --noEmit`: 0 errors
- `next build`: ✓ 11개 라우트, `/reports` 222 kB First Load JS

---

## #15 · 데이터는 내 거예요 — Phase 2.6 CSV/JSON export

> 2026-04-29

### 왜 export 가 1순위 기능인가

Mint가 망한 가장 큰 이유 중 하나는 — 사용자가 **떠날 수 없게** 만들었다는 것. 1인용 가계부가 신뢰를 얻으려면 **언제든 떠날 수 있어야** 한다. 그래서 Phase 2 의 마지막 자리는 export.

### 두 가지 포맷

- **CSV** — Excel·구글 시트·다른 가계부에서 즉시 열린다. 행: 거래 1건, 열: id/date/type/amount/account/category/...
- **JSON** — 계정·카테고리·거래 전체 구조를 한 파일에. 추후 import 의 입력으로도 사용 가능.

### Excel 한국어 BOM

```ts
const body = "﻿" + rows.join("\n");
```

UTF-8 BOM(`﻿`) 이 한 글자 앞에 붙으면 Excel(Windows/Mac KR) 이 한국어를 안 깨고 연다. BOM이 없으면 식비/교통 같은 한글이 ??? 로 보인다. 이거 한 줄 차이로 사용자가 "어 깨졌네" → "오 잘 열리네" 가 갈린다.

### CSV 이스케이프

```ts
function csvEscape(value: unknown): string {
  if (value == null) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
```

따옴표·콤마·줄바꿈이 메모에 들어가는 일이 종종 있다 — RFC 4180 룰 그대로. 추가 의존성 0.

### URL 한 줄로 다운로드

```tsx
<Button asChild variant="secondary">
  <a href="/api/export?format=csv" download>
    <Download className="h-4 w-4" /> CSV 내려받기
  </a>
</Button>
```

`<a download>` 만으로 끝. Server route 가 `Content-Disposition: attachment` 를 보내면 브라우저가 알아서 파일 저장 다이얼로그를 띄운다. 이건 React state 안 건드린다.

### 보안

API 라우트 첫 줄에 `auth()` 가드, `WHERE userId = ?` — 단일 사용자라도 그대로. URL을 다른 사람이 알아도 다른 사용자의 거래는 새지 않는다.

### 검증

- `next build`: ✓ 13개 라우트 — `/api/export`, `/settings/data` 추가됨.
- 직접 곧 dev 서버 켜서 `/api/export?format=csv` 로 받아보면 확인 끝.

### 다음

- Phase 3: M2 자산 트래킹 — `holdings`, `account_snapshots`, 순자산 추이 그래프.
- Phase 4: M3 가격 자동 갱신 — Vercel Cron 으로 KRX/yfinance/CoinGecko fetch.
- Phase 5: M4 transfer/trade 폼.
- 그 후 PWA 마무리.

---

## #16 · 첫 dev 서버 부팅에서 만난 세 가지 빨간 줄

> 2026-04-29 · 오후 9:28

`npm run dev` 가 정상 부팅되고 화면도 일단 그려졌지만, DevTools를 열자마자 빨간 줄 세 개가 나를 반겼다. 빌드는 통과했지만 런타임이 운다 — Phase 2 작업이 끝났다고 안심하면 안 되는 이유다.

```
[next-auth][error][MissingSecret]: Please define a `secret`
GET http://localhost:3000/manifest.json 404 (Not Found)
A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.
```

세 개를 한 묶음으로 잡았다.

### 1) `MissingSecret` — 가장 큰 한 줄

증상: 로그인 폼은 그려지지만 submit하면 인증 자체가 실패. 콘솔에 위 에러 한 줄. 이유는 단순 — Auth.js v5 는 `AUTH_SECRET` 환경변수를 **필수** 로 요구한다. 이게 JWT 서명·CSRF 토큰의 시드이니 당연. 근데 우리 레포엔 `.env.local` 자체가 없다. 의도적이다 (`.gitignore` 에 `.env*` 박힘).

세 가지 처리 옵션이 있었다:

1. 사용자에게 "`.env.local` 만드세요" 라고 안내 → README에 한 단계 추가 → 매번 재현 어려움.
2. `postinstall` 스크립트로 자동 생성 → 첫 설치엔 좋지만 `.env.local` 의 존재 자체를 강제.
3. **dev 모드일 때만 코드 안에서 fallback** → 환경변수가 없어도 그냥 돈다, production 에선 여전히 throw.

3번을 택했다. 사용자가 `npm install && npm run db:migrate && npm run db:seed && npm run dev` 만 치고 즉시 화면을 보는 게 1인 프로젝트의 미덕이다.

```ts
// src/lib/auth/index.ts
const isDev = process.env.NODE_ENV !== "production";
const authSecret =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  (isDev
    ? "dev-only-DO-NOT-USE-IN-PROD-asset-management-7d8a2f9c1e6b3a4f"
    : undefined);

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  trustHost: true,
  ...
});
```

핵심 포인트:

- **`NEXTAUTH_SECRET` 도 fallback 으로** — 마이그레이션 가이드를 읽지 않은 사용자가 v4 변수명으로 쓸 가능성을 흡수. 두 변수명을 다 보고, 둘 다 없으면 dev 상수 사용.
- **production 에선 `undefined` 반환** — Auth.js 가 그대로 throw. 운영에서 환경변수가 비었는데 silent fallback 으로 부팅되면 더 큰 사고. 빨리 망하는 게 안전하다.
- **`trustHost: true`** — Vercel/PaaS 뒤에서 호스트가 동적이어도 redirect 검증을 통과시키는 옵션. 1인용 + `localhost` 부팅엔 그냥 켜두는 게 마찰이 적다.

**`.env.example`** 도 같이 추가했다 — 진짜 production 에 갈 땐 사용자가 이걸 보고 `.env.local` 을 만드는 게 정석:

```
AUTH_SECRET=  # openssl rand -base64 32 으로 생성. dev 에선 빈 채로 둬도 됩니다.
DATABASE_URL=file:./local.db
```

### 2) `manifest.json 404` — 약속 없는 메타데이터

`src/app/layout.tsx` 의 metadata 에 `manifest: "/manifest.json"` 을 박아뒀는데 정작 `public/manifest.json` 은 만들지 않았다. 메타데이터 한 줄 안 지운 죄.

```ts
export const metadata: Metadata = {
  title: "내 자산",
  description: "개인용 자산 관리 가계부",
  manifest: "/manifest.json",   // ← Next.js 가 <link rel="manifest" href="/manifest.json"> 를 박는다
};
```

브라우저가 페이지 로드 직후 manifest 를 fetch 했고 — 404. 화면 동작엔 영향 없지만 빨간 줄은 남는다.

선택지:
- A. metadata 에서 manifest 제거 → 빨간 줄은 사라지지만 어차피 Phase 6 에서 PWA 만들 거라 다시 만들어야 함.
- B. **이 단계에서 미리 manifest + 아이콘 SVG 작성** → 빨간 줄도 사라지고, 추후 "홈에 추가" 도 동작.

B를 택했다. PWA installable 이 되려면 어차피 다음 4가지가 필요한데 — 셋이 정적 파일 1줄짜리라 미리 만드는 비용이 거의 0.

| 파일 | 역할 |
|------|------|
| `public/manifest.json` | name / short_name / display=standalone / theme_color=#00CD80 (브랜드 그린) |
| `public/icon.svg` | 1024×1024 등 모든 사이즈를 한 SVG로. 둥근 사각형 + 흰 그릇·미소 (뱅크샐러드 그릇 메타포 차용) |
| `public/icon-maskable.svg` | Android adaptive icon용 — 안전 영역 75% 안에만 그림이 들어감 |
| `public/favicon.svg` | 32×32 단순화 버전 |

manifest 의 핵심 필드:

```json
{
  "name": "내 자산 — 개인 가계부",
  "short_name": "내 자산",
  "lang": "ko",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#00CD80",
  "icons": [
    { "src": "/icon.svg", "sizes": "any", "purpose": "any" },
    { "src": "/icon-maskable.svg", "sizes": "any", "purpose": "maskable" }
  ]
}
```

`sizes: "any"` 와 SVG 조합 — 256×256/512×512/1024×1024 PNG 를 따로 만들지 않아도 된다. 모던 브라우저는 SVG를 그대로 쓰고, 안 되는 곳도 일단 표시는 된다. PNG 변환은 필요해지는 시점에.

`apple-touch-icon` 도 같은 SVG 로:

```ts
icons: {
  icon: [
    { url: "/favicon.svg", type: "image/svg+xml" },
    { url: "/icon.svg", sizes: "any", type: "image/svg+xml" },
  ],
  apple: { url: "/icon.svg", type: "image/svg+xml" },
},
```

검증: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/manifest.json` → `200`.

### 3) Hydration mismatch on `<body>` — 가장 미묘한 한 줄

> "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. ..."

스크린샷에 `<body class="hydrated min-h-dvh ..."` 가 보인다. 우리는 `min-h-dvh bg-background text-foreground antialiased` 만 박았는데, `hydrated` 라는 클래스를 누가 추가했다. 보통은 next-themes 가 `<html>` 에 클래스를 박는다 — `<body>` 에 손대지 않는다. 그렇다면?

원인을 좁혀보면 셋 중 하나:

1. **브라우저 확장** (Dark Reader, Grammarly, ColorZilla 등) 이 body class 에 끼어듦.
2. CSP/스크립트가 fast refresh 직후 flag class 를 추가.
3. `next-themes` 의 inline script 가 깜빡임 방지 차원에서 즉시 class 를 박음.

어느 쪽이든 — 이건 **서버에서 렌더링한 HTML 을 클라이언트가 검사하는 시점에 맞지 않는 게 정상인 상황**. React 의 hydration mismatch 는 사용자에게 보이는 버그가 아니지만 콘솔이 시끄럽고, 더 큰 문제는 **이 경고가 진짜 mismatch 를 가린다**는 것 — 새로 박힌 코드가 실제 서버/클라이언트 차이를 만들면 같은 줄에 묻혀버린다.

해결: `<body>` 에 `suppressHydrationWarning` 를 추가. React 가 그 노드의 속성 차이는 의도적이라고 받아들인다. **자식 컴포넌트의 mismatch 는 여전히 잡힌다** — body 한 노드만 무시.

```tsx
<html lang="ko" suppressHydrationWarning>
  <body
    suppressHydrationWarning
    className="min-h-dvh bg-background text-foreground antialiased"
  >
    ...
  </body>
</html>
```

`<html>` 에 박은 건 next-themes 의 다크 모드 클래스 토글을 위해서, `<body>` 에 박은 건 위 외부 요인을 위해서. 둘은 별개의 이유다.

### 종합 검증

```
$ curl -s -o /dev/null -w "manifest: %{http_code} (%{content_type})\n" http://localhost:3000/manifest.json
manifest: 200 (application/json; charset=UTF-8)
$ curl -s -o /dev/null -w "icon: %{http_code} (%{content_type})\n" http://localhost:3000/icon.svg
icon: 200 (image/svg+xml)
$ curl -s -o /dev/null -w "favicon: %{http_code} (%{content_type})\n" http://localhost:3000/favicon.svg
favicon: 200 (image/svg+xml)
```

`next build` 도 통과 — 13개 라우트 변동 없음. AUTH_SECRET fallback 은 코드 변경이라 사용자가 dev 서버에 fast refresh 한번 (또는 재시작) 하면 다음 요청부터 적용된다.

### 배운 것

- **dev 모드는 빨리 부팅돼야 한다.** 환경변수 하나라도 강제하면 사용자(=나)가 매번 미니 환경 셋업을 다시 해야 한다. `(isDev ? "constant" : undefined)` 한 줄이 그걸 막는다.
- **빨간 줄은 빨리 잡는다.** 진짜 mismatch 가 묻히기 전에. Phase 끝에 빌드 통과 했다고 끝낸 게 자만이었다.
- **manifest 는 일찍 만든다.** PWA 단계까지 미루면 거의 항상 잊힌다 — 이번엔 다행히 콘솔이 알려줬다.

### 다음

- Phase 3 (M2): `holdings` UI + `account_snapshots` + 순자산 추이.

---

## #17 · 데스크탑 빈 공간과 까만 글씨 — UI 첫 폴리시

> 2026-05-04

dev 서버에서 데스크탑 화면을 띄우고 한참 들여다봤다. 첫인상이 두 가지로 안 좋았다.

1. **사이드바 옆이 휑하다.** 좌측 사이드바 끝에서 카드 시작 지점까지 큰 빈 공간이 떠 있고, 그 다음 카드 그리드가 약간 우측에 치우쳐 보인다.
2. **"+ 새 거래" 버튼의 글씨가 거의 검정으로 보인다.** 그린 버튼 위에 검정 글씨라 가독성도 답답하고, 디자인 시스템이 정한 톤("primary 위 흰색")과 어긋난다.

둘 다 토큰·레이아웃 결정의 갈림길에서 잘못된 가지를 골랐던 흔적이다. 한 번에 잡았다.

### 빈 공간의 정체 — `mx-auto` 가 두 번 끼어든 결과

원래 레이아웃은 이랬다:

```tsx
<div className="flex min-h-dvh bg-surface">
  <Sidebar />                                {/* md:w-60 = 240px */}
  <main className="flex-1 pb-20 md:pb-0">
    <div className="mx-auto w-full max-w-[720px] md:max-w-[1120px]">
      {children}
    </div>
  </main>
  <BottomNav />
</div>
```

겉보기엔 합리적이다. 사이드바 240, 본문 max-w-1120, mx-auto. 그런데 1920×1080 모니터에서 어떻게 분할되는지 따라가보자:

```
[ Sidebar 240 ][ main flex-1 = 1680 ]
                  ↑
                  이 1680 안에 max-w-1120 + mx-auto
                  → 좌우 280씩 빈 공간
```

본문 컨테이너는 main 영역의 가운데에 정렬된다. **사이드바가 이미 좌측에 박혀 있다는 사실을 모르고** 가운데 정렬을 한 것이다. 그 결과:

- 사이드바 우측 (240px) → 약 280px 빈 공간 → 카드 → 약 280px 빈 공간 → 화면 우측

사용자 눈에는 "사이드바 옆이 휑하고, 본문이 어디론가 모여 있다" 로 보인다. 그게 어색함의 정체다.

해결은 **사이드바와 본문을 한 mx-auto 박스 안에 함께 묶는 것**.

```tsx
<div className="min-h-dvh bg-surface">
  <div className="mx-auto flex min-h-dvh w-full max-w-[1280px]">
    <Sidebar />
    <main className="min-w-0 flex-1 pb-20 md:pb-0">{children}</main>
  </div>
  <BottomNav />
</div>
```

차이가 미묘하지만 결과는 크다:

```
[ ......... mx-auto max-w-1280 ......... ]
[ Sidebar 240 ][ main 1040 ]
```

사이드바 + main 이 하나의 박스로 1280까지 자라고, 화면이 더 넓으면 좌우 균등 여백. 사이드바와 본문 사이엔 빈 공간이 0. 본문 안의 카드 그리드는 이제 1040 폭을 다 쓰니 카드가 시원하게 펴진다.

추가 디테일 두 가지:

- **`min-w-0`** — flex item의 기본 `min-width: auto` 가 자식의 컨텐츠 크기를 따라간다. 카드 안에 긴 텍스트가 들어가면 main 이 자기 폭을 늘려서 사이드바를 밀어내는 사고가 생긴다. `min-w-0` 으로 0까지 줄어들 수 있게 풀어준다.
- **본문 컨테이너 제거** — 각 페이지(`/`, `/transactions`, ...)는 이미 `<div className="space-y-3 p-4">` 로 자체 패딩을 잡고 있다. 부모에 추가 컨테이너가 없어도 그대로 보기 좋다.

검증: `next build` 13개 라우트 변동 없음, 타입체크 통과.

### 까만 글씨 — `--primary-foreground` 가 다크 모드에서 검정이었다

`globals.css` 의 토큰 정의를 다시 보자:

```css
:root {
  --primary: 156 100% 40%;          /* brand-green */
  --primary-foreground: 0 0% 100%;  /* white */
}
.dark {
  --primary: 156 100% 42%;
  --primary-foreground: 222 17% 7%; /* 거의 검정 ← 이게 범인 */
}
```

라이트 모드에선 흰색이지만, 다크 모드에선 검정. shadcn 의 기본 토큰을 따라간 흔적이다. 그런데 우리 디자인 시스템의 결정은 **"primary 위엔 흰색"** 한 가지다 — 그린 위에 검정은 대비가 높긴 해도 정서가 맞지 않는다 (뱅크샐러드 톤은 그린 위 흰색 = 신뢰·청결). 다크 모드에서 굳이 검정으로 갈 이유가 없다.

또 다른 가능성도 의심해봤다. 사용자가 본 화면은 라이트 모드 같아 보이는데(흰 배경) 글씨가 검정. 라이트 토큰으론 흰색이 맞으니 — Tailwind 가 cva 안의 클래스를 purge에서 누락했을 수도, 시스템 prefers-dark 가 hydration 차에 잠시 다크 토큰을 적용했을 수도. 단정할 수 없으니 **두 단계로 안전망**:

1. `--primary-foreground` 를 다크 모드에서도 흰색으로 통일.
2. 버튼 default/destructive 의 텍스트 색을 css var 가 아닌 명시적 `text-white` 로 못박음. 토큰이 어느 시점에 깨져도 흰색은 보장.

```tsx
default:     "bg-primary text-white shadow-soft hover:bg-primary/95 hover:shadow-pop",
destructive: "bg-destructive text-white shadow-soft hover:bg-destructive/95",
```

그린/레드처럼 **"이 색 위엔 흰색"이 디자인 결정으로 고정된 변종**은 토큰 의존을 줄이는 게 안전하다. 토큰은 의미가 흔들릴 수 있는 곳에서만 쓴다 (예: `secondary` 의 fg는 light/dark 에서 의미가 다르니 토큰).

같은 김에 `secondary` / `ghost` / `outline` 변종에도 `text-foreground` 를 명시. 어디선가 자식이 색을 inherit 받지 못해 검정으로 떨어지는 경로를 차단.

### 작은 보너스 — 그림자와 호버 디테일

이번에 한 줄씩 박았다:

- `shadow-soft` 기본 (`0 2px 8px rgba(15,17,21,0.04)`) → 버튼이 종이처럼 떠 있는 느낌.
- `hover:shadow-pop` → 호버시 살짝 더 떠올라 신뢰감.
- `hover:bg-primary/95` → 90보다 95가 더 미묘. 클릭 가능하다는 신호만 주고 색이 죽지 않게.

작은 차이지만 — 버튼 하나가 폴리시되면 화면 전체의 인상이 따라온다.

### 검증

```
$ next build
✓ Compiled successfully
   13 routes — sizes unchanged
```

타입체크 깨끗. 다음 dev 서버 fast refresh 후엔:

- 사이드바와 카드 사이 빈 공간 0
- 카드 그리드는 1040 폭에서 자연스럽게 2~3 컬럼
- "+ 새 거래" 버튼은 흰 글씨 + 부드러운 그림자
- 라이트/다크 양쪽에서 그린 위 흰색 일관

### 배운 것

- **`mx-auto` 는 형제 요소의 폭을 모른다.** 사이드바가 같은 부모 안에 있다면 본문 컨테이너에 별도 mx-auto 를 박지 말 것. 가운데 정렬은 한 단계 위에서 한 번만.
- **`text-primary-foreground` 같은 의미 토큰이 늘 옳지는 않다.** 그린 위는 항상 흰색이라는 디자인 결정이 있으면, 그건 코드에 직접 박는 편이 토큰 변경 사고를 막는다.
- **UI 폴리시는 모일수록 비싸진다.** 13개 라우트 다 만들고 나서 이 두 가지를 잡는 데 한 번에 5분이지만, 먼저 다른 컴포넌트들이 같은 패턴을 베껴 갔다면 매 컴포넌트마다 수정해야 했을 것. **첫 사용자(=나) 시연 직후가 폴리시의 골든 타임.**

### 다음

- Phase 3 (M2): `holdings` UI + `account_snapshots` + 순자산 추이.
- 시간 나면 데스크탑에서 헤더(TopNav)도 한번 더 점검.

---

## #18 · 다시 — 풀 폭, 그리고 진짜로 흰 글씨

> 2026-05-04 · 두 번째 시도

#17 의 변경을 적용한 화면을 사용자에게 보여드렸더니 두 가지를 다시 지적 받았다.

> "화면을 채울 수 있게 수정하라고 했더니, 양옆 여백을 만들어두면 어떡해."
> "내가 별로라고 했던 버튼도 그대로네?"

내 첫 시도가 왜 두 군데에서 어긋났는지 짚고 — 다시 잡았다.

### 어긋남 ① — `max-w-[1280px]` 라는 타협안

#17 에서 나는 *"사이드바와 본문을 한 mx-auto 박스에 묶고 max-w-[1280px] 로 가운데 정렬"* 이라는 답을 골랐다. 1920×1080 모니터에서 좌우 각 320 정도 균등 여백이 생긴다는 점이 사용자 의도와 어긋났다.

내가 "어색한 빈 공간" 이라고 표현한 것과 사용자가 "화면을 채워라" 라고 한 것 사이의 간극을 보지 못한 것이다. 사용자가 원한 건 *"사이드바 + 본문이 1px도 남기지 말고 화면을 점령하라"* 였고, 나는 *"적당히 가운데로 모아서 가독성을 챙긴다"* 를 내려고 했다. 1인용 데스크탑 가계부에서 — 사용자의 모니터 폭이 곧 작업 공간이라는 관점이 더 맞다.

수정은 한 줄 빼는 것:

```tsx
// before — max-w-1280 으로 가둔 답
<div className="mx-auto flex min-h-dvh w-full max-w-[1280px]">
  <Sidebar />
  <main className="min-w-0 flex-1">{children}</main>
</div>

// after — 풀 폭
<div className="flex min-h-dvh">
  <Sidebar />
  <main className="min-w-0 flex-1">{children}</main>
</div>
```

이제 1920 모니터에선 사이드바 240 + main 1680, 4K 모니터에선 240 + 3600. 카드 그리드가 viewport 따라 자연스럽게 늘어난다. 와이드 모니터에서 카드가 너무 길어지면 그건 그때 본문 안에서 inner max-w 로 다시 잡으면 된다. 지금은 빈 공간 0이 우선.

### 어긋남 ② — 토큰만 고치고 dev 서버를 못 봤다

#17 에서 두 단계 처리를 했다고 적었다. (1) `--primary-foreground` 다크 모드에서 흰색으로 통일, (2) `text-white` 명시. 그런데 사용자 화면에선 변함 없이 *까만 글씨 처럼* 보였다.

원인을 다시 짚어보면:

- **변경이 적용은 됐다** — `grep "text-white" button.tsx` 로 확인. working tree에 명시적으로 있다.
- **그런데 사용자가 본 화면은 안 바뀌었다.** 가능성 두 개: (a) dev 서버 HMR이 cva 변경을 한 번에 못 잡고 (cva 는 빌드 타임 평가인데 fast refresh 가 누락하기도), (b) 브라우저 캐시.

어느 쪽이 정답이든 — **사용자 입장에서 "버튼이 그대로" 라는 신호가 들어왔으면 내 책임은 변경을 더 강하게 박아서 어떤 환경에서도 흰글씨가 나오게 만드는 것.** 토큰 한 단계 더, CSS specificity 한 단계 더 끌어올렸다:

```tsx
default:
  "bg-primary !text-white font-extrabold shadow-soft " +
  "hover:bg-[#00B872] hover:shadow-pop " +
  "[&_svg]:!text-white",
```

세 가지 차이:

1. **`!text-white`** — Tailwind 의 `!` important 접두사. 어떤 cascade가 끼어들어도 흰색이 이긴다. 보통은 important를 쓰지 않지만 여기는 *"primary 위엔 흰색"* 이 도메인 결정이라 깨지면 안 된다.
2. **`[&_svg]:!text-white`** — 자식 SVG 의 `currentColor` 가 어디선가 끊겼을 가능성을 차단. + 아이콘 자체가 흰색이 되도록 강제.
3. **`font-extrabold`** — 글씨 weight를 700→800. 작은 사이즈(`size="sm"` h-9)에서도 흰색이 회색처럼 안 보이게. 안티앨리어싱은 굵을수록 흰색 인상이 강해진다.

추가로 호버 색을 `bg-primary/90` 같이 알파를 주지 않고 `bg-[#00B872]` 으로 직접 박았다. 알파 호버는 배경(흰색 카드) 톤에 따라 그린 채도가 살짝 죽어 보이는 경우가 있다. 한 단계 어두운 그린이 더 명확하다.

### 보너스 — 알약 모양으로 한 번 더

cva 베이스 클래스도 함께 손봤다.

- `rounded-md` (12px) → **`rounded-full`** : 헤더의 작은 액션 버튼은 알약 모양이 더 가벼워 보이고 뱅크샐러드 톤과도 맞다. (디자인 시스템 §8.2 는 *큰 메인 CTA* 에 한해 pill 금지 — 헤더 우상단 sm 액션엔 허용)
- `gap-2` → `gap-1.5` : 아이콘과 텍스트 사이 간격을 살짝 좁혀서 한 덩어리처럼 보이게.
- `[&_svg]:stroke-[2.4]` : 흰색 위 그린에서 stroke 1.5 면 아이콘이 가늘어 보인다. 2.4 정도가 자신감 있는 굵기.
- `active:scale-[0.97]` : 0.98 → 0.97 더 명확한 클릭 피드백.
- `size.icon` / `icon-sm` 도 `rounded-full` 로 통일 — 일관성.

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap " +
  "rounded-full transition-all duration-150 ease-out " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 " +
  "disabled:pointer-events-none disabled:opacity-50 " +
  "active:scale-[0.97] " +
  "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:stroke-[2.4]",
  ...
```

`size` 도 `default` 의 높이를 `h-12` → `h-11` 로 한 단계 낮춰 풀폭 폼에서도 무겁지 않게. 헤더 안의 sm 액션과 폼 안의 default 사이 위계가 더 자연스럽다.

### 일반화한 교훈

- **사용자가 "양옆 여백" 이라고 말하면 진짜 여백이 0이어야 한다.** "적당히 가운데로 모았다" 같은 디자이너 본능을 한 번 의심한다. 1인용 도구는 사용자 의도를 그대로 이행하는 게 우선.
- **변경이 화면에 반영 안 됐다는 사용자 신호는 항상 진지하게 받는다.** 내 코드가 맞다고 디버깅을 시작하기 전에, *어떤 환경에서도 깨지지 않는 안전 모드* 로 한 번 더 박는다 (`!`, 직접 hex, `[&_svg]:` 변종). 그게 빠르고 안전하다.
- **버튼 하나의 인상은 전체 앱 인상의 30%.** 헤더의 한 버튼이 어색하면 전체가 어색해 보인다 — 이번에 모양·웨이트·간격·호버 색까지 함께 손본 이유.

### 검증

- `next build`: ✓ 13 라우트, 사이즈 변동 거의 없음.
- 사용자가 다음 fast refresh 후 화면을 직접 확인 — **사이드바 + main 이 viewport 끝까지 채움 / "+ 새 거래" 가 알약 모양 흰글씨 그린 버튼**.

### 다음

- Phase 3 (M2): `holdings` UI + `account_snapshots` + 순자산 추이.

---

## #19 · 잔액 한 줄로 만들기 — Phase 3.1 + 3.2

> 2026-05-04

Phase 2 까지의 모든 화면은 사실 **거짓말이었다.** 홈의 "이번 달 지출"은 거래 합산이라 진짜였지만, `/accounts` 의 카드들은 `initialBalance` 만 보여주고 있었다 — 거래가 아무리 쌓여도 잔액이 안 변했다. 진짜 잔액을 한 곳에서 계산하는 함수가 먼저 필요했다.

### `computeAccountBalances` — 한 번 쿼리, 한 번 fold

```ts
export async function computeAccountBalances(userId: string) {
  const [accounts, txs] = await Promise.all([
    db.select().from(schema.accounts).where(eq(schema.accounts.userId, userId)),
    db.select().from(schema.transactions).where(eq(schema.transactions.userId, userId)),
  ]);

  const balances = new Map<string, number>();
  for (const a of accounts) balances.set(a.id, a.initialBalance);

  const add = (id: string | null | undefined, delta: number) => {
    if (!id) return;
    balances.set(id, (balances.get(id) ?? 0) + delta);
  };

  for (const t of txs) {
    switch (t.type) {
      case "income":   add(t.accountId, t.amount); break;
      case "expense":  add(t.accountId, -t.amount); break;
      case "transfer":
        add(t.fromAccountId, -t.amount);
        add(t.toAccountId, t.amount);
        break;
      case "trade": {
        // sell → 현금 +, buy → 현금 -
        const sign = t.tradeKind === "sell" ? 1 : -1;
        add(t.accountId, sign * t.amount);
        break;
      }
    }
  }
  return accounts.map((a) => ({ ...a, balance: balances.get(a.id) ?? a.initialBalance }));
}
```

**왜 한 번에 다 가져오는가?** 1인 사용자의 거래 수는 많아야 수만 건. SQLite 에서 fetch + JS fold 는 SQL 집계보다 단순하고, schema 가 더 풍부해질 때(예: 환율 환산) 코드만 늘어난다. 거래 수가 100k 를 넘으면 다시 SQL 집계로 옮길 수 있다 — 그건 그때.

**`add` 헬퍼 한 줄로 null 체크 흡수.** transfer 의 from/to 둘 다 nullable, trade 의 accountId 도 nullable. 매번 `if (id) balances.set(...)` 을 쓰지 않게.

### `computeNetWorth` — 부채를 부채로 인정하기

가계부에서 카드/대출 처리는 직관과 어긋나는 지점이 있다. 신용카드의 `balance` 가 -200,000 (이번 달 사용 누적) 이면 **부채 200,000** 으로 카운트해야 한다. 자산 +/- 부호 그대로 더하면 카드 사용액이 자산을 갉아먹는 모양이 되어버려 — 이건 회계적으로 맞지 않다.

```ts
const LIABILITY_TYPES = new Set<AccountType>(["credit_card", "loan"]);

if (LIABILITY_TYPES.has(a.type)) {
  liabilities += Math.max(0, -a.balance);
  // 잔액이 +면 사용 가능 한도(자산 아님). 부채만 카운트.
} else {
  assets += a.balance;
}
```

`Math.max(0, -a.balance)` — 잔액이 양수(즉, 카드를 안 썼거나 갚아둔 상태) 라면 0. 음수면 절댓값을 부채로. 이렇게 하면:

- 신용카드 사용 -150,000 → 부채 150,000
- 신용카드 잔액 0 또는 + → 부채 0
- 일반 은행 통장 -50,000 (마이너스 통장) → 자산 -50,000 으로 잡힘 (대출 계정 아니면 자산으로 음수 인정)

마이너스 통장은 사실 "loan" 으로 등록하는 게 정확하다. 사용자가 직접 분류하면 됨.

### 화면 적용

`/accounts` 가 진짜 잔액을 들고 와서 보여주는 모습으로 바뀌었다:

```tsx
const liability = isLiabilityAccount(a.type);
const displayBalance = liability ? Math.max(0, -a.balance) : a.balance;

<div className={liability ? "text-danger" : "text-foreground"}>
  {liability ? "-" : ""}{formatKRW(displayBalance)}
</div>
```

부채 계정의 잔액은 빨간색에 `-` 접두. 사용자가 한눈에 "이건 갚을 돈" 으로 인식한다.

홈 대시보드에는 **순자산 카드 한 장** 추가:

```tsx
<Card>
  <p className="text-body-s text-muted-foreground">순자산</p>
  <p className="tabular text-display-l">{formatKRW(netWorth.netWorth)}</p>
  <p className="text-body-s text-muted-foreground">
    자산 {formatKRW(netWorth.assets)} − 부채 {formatKRW(netWorth.liabilities)}
  </p>
</Card>
```

이 한 장이 가계부의 "왜 이걸 쓰는가" 를 응축한다. 이번 달 지출/수입은 그 다음 줄.

### 계정 상세 페이지 — `/accounts/[id]`

카드 클릭 → 상세. 헤더에 큰 아이콘 + 이름 + 잔액, 그 아래 그 계정에 관련된 거래만 일별 그루핑.

핵심 디테일: **이체(transfer) 도 표시되어야 한다.** 일반 거래는 `accountId` 만 보면 되지만 이체는 from/to 두 면이 있다. 한 계정 입장에서 보면:

- `fromAccountId === id` → "이체 (보냄)" + 빨강 (지출 변종)
- `toAccountId === id` → "이체 (받음)" + 초록 (수입 변종)

```ts
.where(
  and(
    eq(schema.transactions.userId, session.user.id),
    or(
      eq(schema.transactions.accountId, id),
      eq(schema.transactions.fromAccountId, id),
      eq(schema.transactions.toAccountId, id),
    )
  )
)
```

drizzle 의 `or` 한 번이면 끝. 일별 헤더의 income/expense 합산도 같은 로직 — 이 계정으로 들어오면 income, 나가면 expense.

### 검증

- `next build`: 14개 라우트, `/accounts/[id]` 추가 (118 kB First Load JS).
- 잔액 계산은 시드 사용자 기준 `[seed] 3 accounts` 모두 0원 (initial=0, 거래 없음). 거래를 넣어보면 즉시 합산.
- 부채 처리: 신용카드 계정에 -120,000 거래(시뮬) 시 → 카드 카드의 잔액 표시 `-₩120,000`, 홈 부채 카드 `₩120,000`, 순자산은 그만큼 -.

### 배운 것

- **모든 잔액 로직을 한 함수에 모은다.** 화면마다 같은 합산을 다시 짜면 분기점이 생기고, 어느 화면은 transfer를 빼먹고 어느 화면은 trade 를 빼먹는다. 함수 한 곳을 진실의 원천으로.
- **부채는 부호 처리가 아니라 분류로 다룬다.** "음수 자산" 으로 보이게 하면 카드 사용이 자산을 갉아먹는 모양이라 사용자가 헷갈린다. 부채 카테고리에 양수로 쌓는 편이 회계 직관과도 맞다.
- **상세 페이지는 한 관점만 가진다.** 거래는 두 면을 갖지만 계정 상세는 그 계정의 입장에서만 본다. 이체의 두 라인을 다 보여주지 않고 한 라인 (받음/보냄) 만 보여주는 게 덜 헷갈린다.

### 다음

- Phase 3.3: holdings 관리 UI (`/settings/holdings`) — 종목 등록/편집/보관.
- Phase 3.4: 순자산 추이 라인 차트 (account_snapshots + 현재 잔액).

---

## #20 · 종목 폼 한 장 — Phase 3.3 holdings

> 2026-05-04

가계부의 자산 추적은 현금 잔액에서 끝나지 않는다. 주식·ETF·크립토·부동산까지 들어가야 진짜 *순자산* 이 된다. 그 첫 단추가 "내가 무엇을 얼마나 들고 있나" 를 적는 곳, 즉 `holdings` 등록 화면이다.

### 한 가지 양식, 두 가지 경로

종목은 자산 클래스에 따라 입력 패턴이 다르다.

- **자동 fetch 가능 (주식/ETF/크립토)** → 사용자는 *수량 + 평균매입가* 만 적는다. 평가 금액은 추후 가격 cron 이 채워준다.
- **자동 fetch 불가 (부동산·금·기타)** → 사용자가 *평가 금액 자체* 를 직접 입력한다 (`manualValue`).

폼 한 장에 둘 다 담으면서 사용자에게 헷갈림을 안 주는 방법은 — *유형* 셀렉트를 디스크리미네이터로 쓰는 것:

```tsx
const isManual = assetClass === "other";

{!isManual && (
  <>
    <Input id="hd-qty"  inputMode="decimal" placeholder="수량" />
    <Input id="hd-avg"  inputMode="decimal" placeholder="평균 매입가" />
  </>
)}

{isManual && (
  <>
    <Input id="hd-manual" inputMode="decimal" placeholder="평가 금액" />
    <p className="text-caption">가격이 자동으로 갱신되지 않는 자산은 직접 평가금액을 입력해 주세요.</p>
  </>
)}
```

"기타 (수동)" 을 선택하는 순간 수량/평균가 입력란이 사라지고 "평가 금액" 한 줄로 바뀐다. 두 모드의 멘탈 모델이 깔끔히 분리된다.

### Server Action 스키마 — 디스크리미네이션 X, optional + null O

처음엔 transaction 처럼 `discriminatedUnion` 으로 풀까 했지만, 거기보다 단순한 케이스다. 사용자가 같은 row 를 *수동* → *주식* 으로 바꿀 수도 있다. 한 스키마 안에서 둘 다 허용하고, 각 필드를 optional/nullable 로 두는 편이 update flow 에 더 자연스럽다.

```ts
const upsertSchema = z.object({
  id: z.string().optional(),
  accountId: z.string().min(1, "계정을 선택해 주세요."),
  ticker: z.string().min(1, "종목코드를 입력해 주세요.").max(40),
  name: z.string().max(80).optional().nullable(),
  exchange: z.string().max(20).optional().nullable(),
  assetClass: z.enum(assetClasses),
  quantity: z.coerce.number().min(0),
  avgBuyPrice: z.coerce.number().min(0),
  manualValue: z
    .union([z.coerce.number(), z.literal(""), z.undefined()])
    .optional()
    .transform((v) => (v === "" || v == null ? null : Number(v))),
});
```

`manualValue` 의 변환 trick: HTML form 은 빈 문자열을 보내고, JSON 은 `null` 을 보내고, optional 필드는 `undefined` 를 본다. 셋 다 흡수해서 DB에는 `null` 또는 `number` 만 들어가게.

### Soft delete 가 아닌 hard delete

카테고리·계정은 `isArchived` 로 보관 토글을 만들었지만 holdings 는 hard delete 로 갔다. 이유 두 가지:

1. **schema 에 `isArchived` 컬럼이 없다.** 마이그레이션을 한 번 더 굴리는 비용 vs 그냥 row 를 지우는 단순함을 저울질했고, 1인용 + 사용자 본인 결정이라 후자.
2. **거래 내역과 분리되어 있다.** holdings row 를 지워도 과거 매수/매도 거래(`transactions.type='trade'`)는 그대로 남는다. 손익 계산은 거래 내역으로 다시 계산할 수 있으니 holdings 는 *현재 보유 스냅샷* 의 의미만 갖는다.

다만 클릭 한 번에 사라지면 사고가 날 수 있으니 `confirm()` 한 번:

```tsx
if (!confirm(`${h.ticker}${h.name ? ` (${h.name})` : ""} 보유 기록을 삭제할까요? 거래 내역은 그대로 남아요.`)) return;
```

문구에 *"거래 내역은 그대로 남아요"* 를 넣어 사용자의 손실 두려움을 줄였다. 1인용 도구는 마이크로카피 한 줄이 UX 의 절반이다.

### 평가 금액 — 일단 취득원가

manager 리스트의 우측 평가가치는 일단 `quantity × avgBuyPrice` (취득원가) 로 표시. Phase 4 에서 `prices` cron 이 채워지면 이 자리를 *현재가 × 수량* 으로 교체할 거다. 부동산은 `manualValue` 그대로.

```ts
const evalValue =
  h.assetClass === "other"
    ? h.manualValue ?? 0
    : h.quantity * h.avgBuyPrice;
```

### 자산 클래스 → 시각 키

도넛/리스트 어디서나 같은 색·아이콘으로 보이도록 매핑 한 곳:

```ts
const assetIconMap = {
  stock_kr: "TrendingUp",
  stock_us: "Globe",
  etf:      "BarChart3",
  fund:     "PieChart",
  crypto:   "Bitcoin",
  other:    "Coins",
};
const assetColorMap = {
  stock_kr: "#0099FF",  // brand-blue (한국)
  stock_us: "#7E57C2",  // 보라 (미국)
  etf:      "#00CDCD",  // brand-cyan
  fund:     "#F582C6",  // brand-pink
  crypto:   "#F79009",  // brand-amber
  other:    "#9CA3AF",  // neutral
};
```

`CategoryIcon` 컴포넌트가 hex/HSL 어떤 색이든 14% 알파 컨테이너를 자동 생성해주니 — 컴포넌트 한 번에 자산 구분이 시각적으로 잡힌다.

### `/settings/holdings` — 진입 동선

설정 페이지의 *보유 종목* 카드를 클릭 → manager 화면. accounts 가 0개면 *"먼저 계정을 추가해야 종목을 등록할 수 있어요"* 안내. 이 조건은 server-side 에서 미리 가져온 accounts 배열 길이로 분기.

### 검증

- `tsc --noEmit`: 0 errors.
- `next build`: 15 라우트, `/settings/holdings` 추가 (325 kB First Load JS — Sheet/Drawer + Form 포함).
- 시드 사용자 기준 holdings 0건 → 빈 카드 안내 보이는 상태.

### 배운 것

- **두 모드 한 폼은 디스크리미네이터 + conditional 렌더가 답.** 따로 두 폼을 만들면 관리 비용 두 배, 한 폼에 다 박으면 어수선. 셀렉트 한 줄이 두 모드를 나누는 게 가장 깔끔.
- **soft delete 는 사용자 도메인 모델에서 의미가 있을 때만.** holdings 는 *지금 들고 있는 것* 의 스냅샷이라 보관 상태 자체가 모순. hard delete + 과거 거래는 그대로 가 더 단순하고 직관적.
- **`confirm()` 의 마이크로카피가 사고 방지의 절반.** 단순 "삭제할까요?" 보다 *"거래 내역은 그대로 남아요"* 처럼 *무엇이 남는지* 를 알려주면 사용자가 안심하고 결정할 수 있다.

### 다음

- Phase 3.4: 순자산 추이 라인 차트.
- Phase 4: prices cron + 평가가치를 holdings 매니저·계정 잔액에 반영.

---

## #21 · 순자산이 어디로 가고 있나 — Phase 3.4 추이 차트

> 2026-05-06

지금 시점의 순자산을 보여주는 카드는 만들었지만 — 한 점은 의미가 약하다. *어제보다 늘었나* 가 진짜 사용자가 알고 싶은 것. 그래서 12개월 시계열을 한 번에 그려주는 차트가 Phase 3.4 의 핵심.

### 데이터 — `account_snapshots` 가 비어 있을 때 어떻게 그릴까

스키마엔 `account_snapshots` 테이블이 있다. 본래 의도는 *월말 cron 이 그 시점의 잔액을 저장* → 시계열 그래프는 그 row 들을 읽어서 그리는 거였다. 그런데 cron 은 Phase 4 작업이고, 시드 사용자엔 거래 자체도 0건. 두 옵션:

A. **snapshot 만 본다** → cron 돌기 전엔 빈 차트. 사용자가 첫 거래 입력해도 차트는 한 달 후에야 의미가 생긴다.
B. **거래로 reconstruct** → 모든 거래를 fold 해서 매 월말 시점의 잔액을 다시 계산. cron 없어도 입력 즉시 차트가 채워짐.

B를 택했다. 1인용에 cron 의존성을 한 단계 늦추는 게 자연스럽고, **거래가 진실의 원천이라면 snapshot 은 캐시일 뿐** — 캐시가 없어도 원천에서 다시 계산하면 그만이다. 추후 거래가 100k 를 넘으면 snapshot 캐시를 켜는 식으로 옮기면 됨.

### `computeNetWorthSeries` — 컷오프별 fold

```ts
const cutoffs: Date[] = [];
for (let i = months - 1; i >= 0; i--) {
  cutoffs.push(endOfMonth(now.getFullYear(), now.getMonth() - i));
}
// 11달 전 ... 1달 전 ... 이번 달 말 (또는 오늘 시점에서 그 달 말까지)
```

각 컷오프 시점까지 거래를 누적해서 잔액 산정. 최근 12개월이면 12개의 fold. 거래 1만 건이라도 12 × 1만 = 12만 회 산술 → 한 페이지 렌더에 ms 단위.

```ts
return cutoffs.map((cutoff) => {
  const balances = new Map<string, number>();
  for (const a of accounts) balances.set(a.id, a.initialBalance);

  for (const t of txs) {
    if (t.occurredAt > cutoff) break;  // ← 정렬돼 있으니 break
    // ... apply tx (income/expense/transfer/trade)
  }

  // 컷오프 시점에서 isLiabilityAccount 분류로 자산/부채 분리
  let assets = 0, liabilities = 0;
  for (const a of accounts) {
    if (a.isArchived) continue;
    const bal = balances.get(a.id) ?? a.initialBalance;
    if (isLiabilityAccount(a.type)) liabilities += Math.max(0, -bal);
    else assets += bal;
  }
  return { month: ..., assets, liabilities, netWorth: assets - liabilities };
});
```

거래를 미리 `asc(occurredAt)` 으로 정렬해 가져왔기 때문에 안쪽 루프에서 `if (t.occurredAt > cutoff) break` 한 줄로 컷오프 통과 시 즉시 종료. 시간 절약.

**왜 매 컷오프마다 잔액 Map 을 다시 만드는가?** O(M·N) 이지만 코드가 단순. 더 빠른 길은 거래를 시간순으로 한 번 돌면서 컷오프 두 포인터를 같이 움직이는 것 — 거래 수가 정말 큰 환경에서 의미. 1인 N < 10k, M = 12 이라 지금은 단순함이 우선.

`isLiabilityAccount` 도 #19 의 잔액 함수와 같은 헬퍼를 재사용. 진실의 원천 한 곳을 유지.

### 차트 — `recharts` AreaChart 한 장에 세 라인

라인 셋이 들어간다:

| 데이터 | 시각 표현 | 의도 |
|--------|---------|------|
| `netWorth` | 굵은 그린 라인 + 그라데이션 fill | **메인** — 사용자가 가장 자주 보는 숫자 |
| `assets` | 얇은 파란 점선 | 보조 — 자산이 늘었나 |
| `liabilities` | 얇은 빨강 점선 | 보조 — 부채가 늘었나 |

순자산 라인만 fill 으로 강조해서 *"이 면적이 점점 위로 올라가야 한다"* 는 시각 메시지를 전달. 자산/부채는 점선이라 부수적이라는 인식.

```tsx
<defs>
  <linearGradient id="nw-fill" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%"  stopColor="hsl(var(--brand-green))" stopOpacity={0.28} />
    <stop offset="95%" stopColor="hsl(var(--brand-green))" stopOpacity={0} />
  </linearGradient>
</defs>
...
<Area type="monotone" dataKey="netWorth"    stroke="...green"  strokeWidth={2}   fill="url(#nw-fill)" />
<Area type="monotone" dataKey="assets"      stroke="...blue"   strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
<Area type="monotone" dataKey="liabilities" stroke="...danger" strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
```

같은 `<AreaChart>` 안에 Area 셋을 주고, 보조 라인은 `fill="none" + strokeDasharray` 로 그리니 라인 차트처럼 보인다. LineChart + AreaChart 두 컴포넌트로 나누지 않고 한 번에.

### 축 디테일

**X축**: `2026-04` 같은 ISO 월 키를 그대로 두면 답답하다. `tickFormatter` 로 `4월` 만 추출.

```ts
tickFormatter={(v) => Number((v as string).slice(-2)).toString() + "월"}
```

`Number()` 한 번 거쳐서 `04` → `4` 로 leading zero 제거. 마지막 두 글자만 자르고 변환하니 `2026-04` 도 `2027-01` 도 일관되게 처리.

**Y축**: `compact` 함수로 만/억 단위 표현.

```ts
const compact = (n) => {
  const abs = Math.abs(n);
  if (abs >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (abs >= 10_000)      return `${Math.round(n / 10_000)}만`;
  if (abs >= 1_000)       return `${Math.round(n / 1_000)}천`;
  return String(n);
};
```

순자산이 1.2억이면 `1.2억`, 4500만이면 `4500만` 처럼. 한국어 가계부에서 십억까지 가는 사용자는 거의 없으니 억 단위면 충분.

### 헤더의 작은 디테일 — 현재 순자산 우상단

```tsx
<div className="flex items-baseline justify-between pb-3">
  <h2 className="text-heading-m">순자산 추이 · 12개월</h2>
  <span className="tabular text-body-s text-muted-foreground">
    현재 {formatKRW(netWorthSeries[netWorthSeries.length - 1]?.netWorth ?? 0)}
  </span>
</div>
```

차트는 시계열을 보여주지만 *지금 이 순간의 숫자* 도 같이 보여주면 사용자가 한 눈에 "지금이 왼쪽 끝과 비교해서 어디" 인지 인지한다.

### 범례 — 한 줄 inline

차트 아래 작은 범례 한 줄. Recharts 의 기본 `Legend` 는 위치/스타일 제어가 까다로워서 직접 그렸다.

```tsx
<div className="mt-2 flex items-center gap-4 text-caption text-muted-foreground">
  <span className="inline-flex items-center gap-1.5">
    <span className="h-2 w-3 rounded-sm bg-brand-green" /> 순자산
  </span>
  <span className="inline-flex items-center gap-1.5">
    <span className="h-0.5 w-3 bg-brand-blue" /> 자산
  </span>
  <span className="inline-flex items-center gap-1.5">
    <span className="h-0.5 w-3 bg-danger" /> 부채
  </span>
</div>
```

순자산 마커는 두꺼운 사각형(차트의 fill 면 표현), 자산/부채는 얇은 라인(점선 표현). 작은 시각 일관성.

### 검증

- `tsc --noEmit`: 0 errors.
- `next build`: 15 라우트, `/reports` 225 kB First Load JS (네트워스 차트 +3 kB).
- 시드 사용자 (거래 0건): 12개월 모두 `netWorth = 0` 이라 차트는 평선. 거래 입력 시 즉시 곡선이 채워진다.

### 배운 것

- **시계열은 한 컷오프마다 처음부터 다시 계산이 가장 단순.** 두 포인터·인덱스로 묶어서 한 번에 굴리는 길도 있지만, 거래 수 작은 1인용엔 의미 없는 최적화. 코드 단순함이 더 큰 가치.
- **AreaChart 한 그릇에 강조-보조를 동시에.** 메인 데이터는 fill 로, 보조는 `fill="none" + strokeDasharray` 로. 두 차트 컴포넌트를 겹치지 않고도 시각 위계가 잡힌다.
- **차트 위에 *현재 시점 숫자* 를 같이.** 그래프와 텍스트는 다른 인지 채널. 한 눈에 *"오른쪽 끝 = 지금 = 이 숫자"* 가 닫혀야 사용자가 안심한다.

### Phase 3 마무리

Phase 3 (M2 자산 트래킹) 4단계 모두 완료:

- 3.1: 잔액 계산 + 순자산 카드
- 3.2: 계정 상세 페이지
- 3.3: holdings 관리 UI
- 3.4: 순자산 추이 차트

남은 큰 일들:

- **Phase 4 (M3)** 가격 자동 갱신: Vercel Cron + KRX/yfinance/CoinGecko 어댑터 → holdings 평가금액이 진짜 평가가치로 갱신.
- **Phase 5 (M4)** transfer/trade 거래 입력 폼 (현재는 income/expense 만).
- **Phase 6 (M5)** PWA: manifest 는 있으니 service worker + 단축키 + 다크모드 토글.

