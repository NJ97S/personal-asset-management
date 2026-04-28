# 개인 자산 관리 / 가계부 서비스 — MVP 기획서

작성일: 2026-04-25
대상 사용자: 본인 1인 (개인용)
관련 문서: [competitor-analysis.md](./competitor-analysis.md)

---

## 1. 요구사항 요약

### 1.1 인터뷰로 확정된 사실

| 항목 | 결정 |
|------|------|
| 최종 목표 | **개인용** (1인 사용자, 외부 공개/수익화 없음) |
| 핵심 동기 | **지출 추적** + **순자산 트래킹** |
| 사전 예산/목표 기능 | 제외 (사후 분석 중심) |
| 주 모바일 디바이스 | **Android** |
| 데이터 입력 | **순수 수동** (LLM 보조 없음) |
| 데이터 저장 | **클라우드 DB** (단일 인스턴스, 자동 동기화) |
| 거래 모델 | **하이브리드** — 일반 거래는 단순 income/expense, 자산 이동/주식 거래는 이중 계정 |
| 자동화 보조 | **자산 가격 자동 fetch만** (주식/펀드/크립토) |
| 플랫폼 | 데스크탑 + 모바일 (PWA로 통합) |

### 1.2 의도적으로 빼는 것 (Non-Goals)

- 다중 사용자, 회원가입 플로우, 권한 모델
- 마이데이터 / 은행 OAuth 연동 (개인이 못 함)
- SMS 카드 문자 자동 파싱 (수동 선택)
- LLM 카테고리 추천 / 자연어 입력 (MVP 제외)
- 사전 예산 (budgeting), 목표 달성 트래킹
- 결제, 구독 관리 (Rocket Money 식)
- 광고 / 금융상품 추천
- 네이티브 앱 (RN/Flutter) — PWA만

---

## 2. 핵심 가치 제안

> **"내 데이터, 내 룰. 광고 없는 깨끗한 1인 자산 가계부."**

- 수동 입력 100% 통제 → 데이터 정확도 보장
- 광고/추천 0 → 깔끔한 UX
- 자산(주식/크립토 등) 시세 자동 갱신 → 매일 순자산 추이 자동 업데이트
- PWA → 데스크탑 / Android / iPhone 모두 단일 코드베이스
- 완전한 CSV export → 데이터 잠김 없음

---

## 3. 기능 명세 (MVP 범위)

### 3.1 핵심 기능 (M1: 가장 먼저 동작해야 함)

| # | 기능 | 수용 기준 |
|---|------|-----------|
| F1 | **거래 입력** (지출/수입) | 모바일/데스크탑 모두 3초 이내 입력 (날짜/금액/카테고리/메모/계정), 가장 최근 사용 카테고리/계정이 기본 선택 |
| F2 | **카테고리 관리** | 2단계 계층(부모/자식) 지원, 색/아이콘 커스텀, 활성/숨김 토글 |
| F3 | **계정 관리** | 계정 타입: cash / bank / credit_card / stock / crypto / real_estate / loan / other. 통화: KRW 기본, USD 등 추가 가능 |
| F4 | **거래 목록** | 무한 스크롤, 기간/카테고리/계정/금액범위 필터, 검색(메모/거래처) |
| F5 | **거래 편집/삭제** | 단건 수정, 일괄 카테고리 변경 |
| F6 | **월별 지출 리포트** | 카테고리별 도넛, 일자별 막대, 전월 대비 % 변화, top 5 지출 거래처 |

### 3.2 자산 트래킹 (M2)

| # | 기능 | 수용 기준 |
|---|------|-----------|
| F7 | **계정 잔액 스냅샷** | 매월 말 자동(Cron) 또는 수동 기록. 부동산처럼 fetch 안 되는 자산은 사용자가 수동 입력 |
| F8 | **순자산 추이 그래프** | 일/주/월/연 단위, 자산-부채 분리 표시, 6개월 / 1년 / 전체 토글 |
| F9 | **자산 분포 (Allocation)** | 현금/투자/부동산/암호화폐/부채 등 카테고리별 비율 (도넛 + 트렌드) |

### 3.3 투자 자산 자동 갱신 (M3)

| # | 기능 | 수용 기준 |
|---|------|-----------|
| F10 | **종목 보유 등록** | 종목코드(KRX 6자리, US ticker, 크립토 symbol), 보유 수량, 평균 매입가 |
| F11 | **가격 자동 fetch** | Vercel Cron으로 매일 1회 (장마감 후), 무료 데이터 소스 사용 |
| F12 | **종목별 손익 표시** | 평가금액 = 수량 × 현재가, 손익 = (현재가 - 평균가) × 수량, % 수익률 |

### 3.4 거래 고급 모델 (M4)

| # | 기능 | 수용 기준 |
|---|------|-----------|
| F13 | **자산 이체 (transfer)** | A계정→B계정 단일 트랜잭션. 지출 리포트에 안 나옴, 잔액에만 영향 |
| F14 | **주식 거래 (trade)** | 매수: 현금계정↓ + 보유종목↑. 매도: 보유종목↓ + 현금계정↑. 거래소수수료 처리 |

### 3.5 운영/UX (M5)

| # | 기능 | 수용 기준 |
|---|------|-----------|
| F15 | **PWA 설치** | manifest.json + service worker, Android/iOS 홈 추가 가능 |
| F16 | **CSV import / export** | 전체 거래 백업/복원 (자체 포맷 + 일반 표준) |
| F17 | **인증** | 단일 사용자 비밀번호 + 세션, magic link 옵션 |
| F18 | **다크모드 / 키보드 단축키** | n=새 거래, /=검색, j/k=목록 이동 |

### 3.6 추후 권 (Out of MVP)

- LLM 카테고리 추천 (M6+)
- 자연어 한 줄 입력 ("어제 점심 김밥 8500원 신한카드")
- SMS 카드 문자 파싱 (Android 네이티브 사이드 앱)
- 영수증 OCR
- 다중 통화 환전 자동 계산
- 백업 자동 (Vercel Blob에 일일 스냅샷)

---

## 4. 기술 스택 제안

### 4.1 추천 스택 (Vercel 환경에 맞게)

| 영역 | 선택 | 근거 |
|------|------|------|
| 프레임워크 | **Next.js 16 App Router** | Vercel 1급 지원, Cache Components, Server Actions, 단일 코드로 SSR/CSR/PWA |
| 언어 | TypeScript (strict) | 금융 데이터 타입 안전성 필수 |
| UI | **Tailwind CSS + shadcn/ui** | 빠른 개발, 일관된 디자인, Radix 접근성 |
| DB | **Neon Postgres** (Vercel Marketplace) | Vercel 1-click, 분기당 무료 한도 충분, 장기 저장 안정 |
| ORM | **Drizzle ORM** | 가벼움, 타입 안전, Postgres 기능 직접 활용 |
| 인증 | **Auth.js (NextAuth v5)** | magic link / 비밀번호 한 가지, 단일 사용자라 가벼움 |
| 배포 | **Vercel** (Fluid Compute) | Cron, Functions, Preview 모두 1급 |
| 차트 | **Recharts** 또는 Tremor | shadcn/ui 호환, SSR 가능 |
| 폼 | React Hook Form + Zod | 타입 검증, UX |
| 날짜 | date-fns + tz | 시간대 KRW 거래 타임존 명확화 |
| 가격 fetch | Vercel Cron (`vercel.ts crons`) | 매일 KST 18:30 (KOSPI 장마감 후) |
| 모니터링 | Vercel Analytics + Speed Insights | 무료 |
| (선택) Edge cache | Vercel Runtime Cache | 가격 데이터 캐싱 |

### 4.2 자산 가격 데이터 소스

| 자산 클래스 | 무료 소스 | 백업 |
|-----------|----------|------|
| 한국 주식 | KRX 공공 데이터 (D+1 종가) | 한국투자증권 OpenAPI (영업증권 계좌 필요) |
| 한국 펀드 | 금융투자협회 (제공 형식 까다로움) | 수동 입력으로 우선 |
| 미국 주식/ETF | yfinance (Yahoo Finance 비공식) | Alpha Vantage 무료 한도 |
| 크립토 | CoinGecko API (무료 키) | Binance public |

> **주의**: 크롤링 기반 소스(네이버금융 등)는 ToS 위반 가능성 → 공식 API 우선

### 4.3 PWA 전략

- `next-pwa` 또는 Next.js 16 자체 PWA 지원
- 오프라인은 **읽기만** (캐시된 거래/자산 조회). 새 거래 입력은 온라인 필요 (단일 사용자라 충돌 거의 없음)
- iOS Safari 16.4+ Web Push (선택)
- Android에서 Add to Home → 거의 네이티브 경험

---

## 5. 데이터 모델 (Drizzle 스키마 초안)

```
users
  id, email, name, password_hash | magic_link_only
  created_at

accounts
  id, user_id, name, type ENUM('cash','bank','card','stock','crypto','real_estate','loan','other')
  currency CHAR(3) DEFAULT 'KRW'
  initial_balance DECIMAL  -- 시작 잔액 (overrides snapshots before this date)
  is_archived BOOLEAN
  created_at

categories
  id, user_id, parent_id NULL,
  name, icon, color,
  kind ENUM('income','expense'),
  sort_order, is_archived

transactions
  id, user_id, occurred_at TIMESTAMP, type ENUM('income','expense','transfer','trade')
  -- 단순 거래
  account_id (income/expense)
  category_id (income/expense, NULL for transfer/trade)
  amount DECIMAL  -- always positive
  currency CHAR(3)
  -- 이체
  from_account_id, to_account_id (transfer)
  -- 주식 거래
  trade_kind ENUM('buy','sell') NULL
  ticker, quantity DECIMAL, price_per_unit DECIMAL, fee DECIMAL
  -- 공통
  payee TEXT, memo TEXT, tags TEXT[]
  created_at, updated_at

holdings
  id, user_id, account_id, ticker, exchange, asset_class ENUM('stock_kr','stock_us','etf','fund','crypto','other')
  quantity DECIMAL, avg_buy_price DECIMAL
  manual_value DECIMAL NULL  -- 부동산 등 fetch 안 되는 자산용
  last_priced_at TIMESTAMP

prices
  ticker, date DATE, close DECIMAL, currency
  PRIMARY KEY (ticker, date)
  -- Cron이 매일 채움

account_snapshots
  id, user_id, account_id, snapshot_date DATE, balance DECIMAL
  -- 월말 cron 자동 + 수동 보정
  UNIQUE (account_id, snapshot_date)

settings
  user_id, base_currency CHAR(3), tz, theme, locale
  fx_rates_updated_at  -- 환율 캐시
```

### 5.1 잔액 계산 규칙

- **현금/은행/카드**: `initial_balance + Σ(income) - Σ(expense) ± Σ(transfer 영향)`
- **주식 계정**: `Σ holdings.quantity × prices(latest)` + 미투자 현금
- **부동산/기타 수동 자산**: `holdings.manual_value`의 최신값
- **순자산**: 자산 계정 잔액 합계 - 부채 계정(loan/card 음수) 잔액 합계

### 5.2 일관성 보장

- transfer/trade는 단일 트랜잭션이지만 잔액에는 양쪽 영향 → 인덱스에 from/to 모두 포함
- 카테고리 삭제 시 해당 거래는 'uncategorized'로 폴백 (외래키 SET NULL)

---

## 6. 화면 구조 (정보 아키텍처)

```
/login           -- 비밀번호 또는 magic link
/                -- 대시보드 (이번 달 지출, 순자산 미니, 최근 거래 5건)
/transactions    -- 거래 목록 + 빠른 입력 (FAB)
/transactions/new -- 풀 폼 (모바일에서 깔끔)
/accounts        -- 계정 카드 그리드, 클릭 → 상세
/accounts/[id]   -- 계정별 거래/잔액 추이
/holdings        -- 종목 보유 + 현재가/손익
/reports         -- 지출 분석 / 순자산 추이 탭
/settings        -- 카테고리/계정 관리, 백업, 통화, 비밀번호
```

### 6.1 빠른 입력 UX (가장 중요)

- 데스크탑: `n` 단축키 → 인라인 폼, Tab 순서 (날짜→금액→카테고리→계정→메모)
- 모바일: 화면 우하단 FAB → 풀스크린 모달, 숫자키 1순위, 카테고리 칩 가로 스크롤
- 자동완성: 메모/거래처는 과거 입력 기반 fuzzy 매칭, 가장 최근 사용 카테고리/계정 기본 선택
- 입력 후 0.5초 토스트 → 즉시 새 거래 입력 가능

---

## 7. 단계별 구현 계획

### Phase 1: 기반 (1주)
1. Next.js 16 프로젝트 생성 (App Router, TypeScript, Tailwind)
2. shadcn/ui 초기화, 테마 설정
3. Neon Postgres 연결 (`vercel:bootstrap` skill로 자동 셋업)
4. Drizzle 스키마 작성 + 마이그레이션
5. Auth.js 인증 (단일 사용자 가정, magic link)
6. 레이아웃: 헤더/사이드바/모바일 하단 탭

### Phase 2: M1 핵심 거래 (1-2주)
7. `/transactions` 목록 (Server Components + 페이지네이션)
8. 거래 입력 폼 (Server Action, optimistic update)
9. 카테고리/계정 CRUD (`/settings`)
10. `/reports` 월별 카테고리 차트 (Recharts)
11. CSV export

### Phase 3: M2 자산 트래킹 (1주)
12. holdings + account_snapshots 테이블/UI
13. `/accounts` 그리드, 계정별 잔액 계산 함수
14. `/reports` 순자산 추이 그래프

### Phase 4: M3 가격 자동 갱신 (3-5일)
15. Vercel Cron 함수 (`/api/cron/fetch-prices`) — KST 18:30
16. 가격 어댑터: KRX, yfinance, CoinGecko
17. holdings.last_priced_at 갱신, prices 테이블 적재
18. 캐시 (Runtime Cache로 24h TTL)

### Phase 5: M4 고급 거래 (3-5일)
19. transfer / trade 타입 거래 폼
20. 종목 매수/매도 시 holdings 자동 업데이트 (트랜잭션)

### Phase 6: M5 PWA + UX 마무리 (3-5일)
21. manifest.json, service worker, install prompt
22. 키보드 단축키 (`useHotkeys`)
23. 다크모드
24. 에러 바운더리, Sentry 또는 Vercel Logs 연동

### 총 예상: 4-6주 (부분 시간 기준)

---

## 8. 리스크와 완화

| 리스크 | 영향 | 완화 |
|--------|------|------|
| 한국 주식 가격 무료 API 부재 | 자산 트래킹 불완전 | KRX 공공데이터 D+1 종가로 시작, 실시간은 추후. 사용자 수동 보정 가능 |
| iOS PWA 제약 (Web Push, 백그라운드) | 알림 한계 | MVP에선 알림 없이 출발. 16.4+ Web Push로 추후 |
| 계정 잔액 누적 오차 (수동 입력 → drift) | 데이터 신뢰도 | 월말 잔액 보정 (account_snapshots) UI 제공, "기준 잔액 재설정" 기능 |
| 단일 사용자 가정의 보안 | DB 노출 시 전체 데이터 유출 | Auth.js + 강한 비밀번호 + Neon은 TLS, 추가로 민감 컬럼은 future 옵션 (애플리케이션 레이어 암호화) |
| Vercel Cron 실패 (한 번 누락) | 가격 1일 누락 | 다음 실행 시 빠진 날짜 백필 (`prices` 테이블 UNIQUE 활용) |
| Neon 무료 한도 초과 | 서비스 중단 | 월말 백업 (CSV/Vercel Blob), 한도 도달 시 알림. 1인 사용 데이터량 작아 가능성 매우 낮음 |
| 통화 환산 정확도 | 다국적 자산 표시 | base_currency 1개 + 환율 캐시 (ECB or 한국은행), 환산 시점 명시 |
| 데이터 잠김 (서비스를 떠날 때) | 신뢰 저하 | CSV export 1순위 기능. JSON export도 제공 |

---

## 9. 검증 단계 (Verification)

| # | 검증 항목 | 방법 |
|---|----------|------|
| V1 | 거래 입력 → 잔액 즉시 반영 | E2E (Playwright): 입력 후 계정 잔액 = 이전 + 금액 |
| V2 | 이체는 지출 리포트에서 빠짐 | 단위 테스트: `/reports` 합계에서 type=transfer 제외 확인 |
| V3 | 주식 매수 후 holdings 정확 | 단위: buy 5주 @ 10,000 → quantity 5, avg 10,000. 추가 buy 시 가중평균 |
| V4 | 가격 fetch 후 평가금액 갱신 | 통합: cron 실행 → prices 새 row → /holdings에 새 가격 |
| V5 | CSV export → 다른 가계부에서 import | 수동: Actual Budget 호환 포맷 확인 |
| V6 | PWA 오프라인 읽기 | 수동: 비행기모드에서 거래 목록 조회 |
| V7 | 모바일 빠른 입력 3초 이내 | 수동 측정: FAB 탭 → 저장 클릭까지 |
| V8 | 데스크탑/모바일 동시 사용 일관성 | 수동: 한쪽에서 입력 → 5초 내 다른 쪽 새로고침으로 보임 |

---

## 10. 운영/유지 비용 추정 (Vercel + Neon 기준)

| 항목 | 1인 사용 시 예상 |
|------|-----------------|
| Vercel Hobby | 무료 (개인 프로젝트, 비상업) |
| Neon Postgres Free | 무료 (0.5GB, 191hrs compute) |
| 도메인 | 선택 (`xxx.vercel.app` 무료) |
| 이메일 (magic link) | Resend 무료 한도 (월 3000건) |
| 가격 API | CoinGecko/yfinance 무료, KRX 공공데이터 무료 |
| **총** | **월 0원** (도메인 제외) |

---

## 11. 향후 확장 옵션 (Out of Scope, 메모만)

- LLM 카테고리 추천 (Vercel AI Gateway, 월 약 1-3$ 정도)
- 자연어 한 줄 입력 (`tools` 호출로 거래 직접 생성)
- 영수증 OCR (이미지 → LLM vision)
- 안드로이드 컴패니언 앱 (SMS 권한 사용해 PWA로 푸시)
- 다중 사용자/공유 (커플/가족) — 나중에 갈 길 있으면 멀티테넌트로 마이그레이션
- 백업 자동화 (Vercel Blob, S3, Google Drive)

---

## 12. 즉시 시작할 수 있는 다음 작업

1. `pnpm dlx create-next-app@latest asset-management --typescript --tailwind --app` 으로 스캐폴딩
2. shadcn/ui init
3. Vercel 링크 (`vercel link`) + Neon 통합 (`vercel:bootstrap` skill)
4. Drizzle 셋업 + 첫 마이그레이션
5. Auth.js 단일 사용자 magic link 구현

위 5단계만 끝나면 **첫 거래를 입력할 수 있는 골격**이 만들어집니다.

---

## 부록 A: 인터뷰 결정 기록

| 질문 | 답변 | 영향 |
|------|------|------|
| 프로젝트 목표 | 개인용 (나만 쓰는 도구) | 멀티테넌시/결제 제외 |
| 핵심 동기 | 지출 추적 + 순자산 트래킹 | 예산/목표 기능 제외 |
| 모바일 디바이스 | Android | SMS 파싱 가능 옵션이지만 사용자가 수동 선택함 |
| 입력 방식 | 100% 수동 | 빠른 UX(단축키/FAB)에 집중 |
| 데이터 저장 | 클라우드 DB | Neon Postgres + Vercel |
| 거래 모델 | 하이브리드 | income/expense 단순 + transfer/trade 정밀 |
| 보조 자동화 | 자산 가격 fetch만 | LLM/SMS 파싱 제외, Cron만 추가 |
