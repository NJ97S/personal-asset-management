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
