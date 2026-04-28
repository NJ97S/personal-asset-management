# 디자인 시스템 — 뱅크샐러드 레퍼런스 기반

작성일: 2026-04-29
대상 프로젝트: 개인용 자산관리 PWA (1인 사용자)
관련 문서: [asset-management-mvp.md](./asset-management-mvp.md)
레퍼런스: [Banksalad](https://www.banksalad.com), [BPL Design Blog](https://blog.banksalad.com/tags/design-system/)

> **목적**: Phase 1 스캐폴딩 전에 디자인 토큰(컬러/타이포/스페이싱/모서리/그림자)과 컴포넌트 원칙을 확정해 `tailwind.config.ts`, `globals.css`, shadcn/ui 테마에 일관되게 박는다.

---

## 1. 개요와 톤

### 1.1 레퍼런스를 고른 이유
- 데이터-퍼스트 IA(자산 총액·거래 분석을 첫 화면에 배치)가 본 프로젝트의 "지출 추적 + 순자산 트래킹" 목표와 정확히 일치.
- 친근한 마이크로 카피, 파스텔 톤, 둥근 그릇/스마일 메타포 → 개인 1인 가계부의 정서와 맞음.
- BPL이 공개적으로 디자인 시스템을 글로 남겨 학습 자료가 풍부.

### 1.2 그대로 가져올 것
- Pretendard 단일 폰트 + 그린 메인 컬러
- 둥근 카드(12–16px) + 거의 없는 그림자 + 굵은 디바이더 대신 여백
- Bottom Sheet 중심 인터랙션 (FAB 없음)
- 일별 헤더 그루핑된 거래 목록
- 친근한 한국어 마이크로 카피("기록했어요!" 식)

### 1.3 가져오지 않을 것 (1인용 제약)
- 또래 자산 순위(데이터 풀 없음)
- 금융 상품 추천 마켓플레이스(수익화 안 함)
- 마이데이터 자동 연동 카피(거짓 약속 방지)
- 샐러드게임/팀 미션(멀티유저 없음)
- BPL 642 컴포넌트 풀스케일(과잉 — shadcn 기본 + 6~8개 커스텀이면 충분)

### 1.4 보이스 앤 톤
- **친근체** ("했어요" / "예요" 종결). 사무적 "하였습니다" 회피.
- **즉시 보상**: 입력/완료/저장 후 짧은 토스트 ("기록했어요", "이번 달 첫 외식이에요"). 카피는 룩업 테이블로 관리.
- **정직성**: 자동화 못 하는 것은 "수동 입력하세요"라고 분명히 말함. "분석 중..." 같은 가짜 진행 표시 X.
- **에러 톤**: 사과보다 다음 액션 제시 ("다시 시도하기" 버튼 + 한 줄 원인).

---

## 2. 브랜드 컬러 토큰

### 2.1 코어 브랜드 컬러 (확신도 high — BPL 블로그 SVG에서 추출)

| 토큰 | hex | 용도 | 비고 |
|------|-----|------|------|
| `--brand-green` | `#00CD80` | **Primary** — CTA 버튼, 활성 상태, 양수(수입) | 시그니처 |
| `--brand-blue` | `#0099FF` | 보조 액센트, 정보 카드, 차트 2번째 색 | |
| `--brand-cyan` | `#00CDCD` | 차트 3번째 색, 하이라이트 | |
| `--brand-pink` | `#F582C6` | 차트 4번째 색, 카테고리 칩 | |
| `--text-primary` | `#2A2B33` | 본문, 헤딩 — 순검정 X (쿨한 다크 차콜) | BPL 워드마크 색 |

### 2.2 뉴트럴 스케일 (확신도 medium — 컨벤션 기반)

뱅크샐러드 공식 토큰표는 비공개. shadcn/ui 컨벤션과 한국 핀테크 표준을 따름.

| 토큰 | Light | Dark | 용도 |
|------|-------|------|------|
| `--background` | `#FFFFFF` | `#0F1115` | 페이지 최하단 |
| `--surface` | `#F7F8FA` | `#15171D` | 카드 배경 (라이트), 페이지 (다크) |
| `--card` | `#FFFFFF` | `#1C1F26` | 카드 |
| `--border` | `#EEF0F3` | `#262932` | 디바이더 |
| `--muted` | `#F2F4F7` | `#1F2229` | 입력 필드, 비활성 |
| `--text-primary` | `#2A2B33` | `#E8EAEE` | 본문 |
| `--text-secondary` | `#6B7280` | `#9CA3AF` | 보조 텍스트 |
| `--text-tertiary` | `#9CA3AF` | `#6B7280` | 캡션, placeholder |

### 2.3 시멘틱 컬러

| 토큰 | hex | 용도 | 출처 / 근거 |
|------|-----|------|-----------|
| `--success` | `#00CD80` (브랜드 그린 재사용) | 수입, 성공, 양수 | BPL — 그린이 곧 success |
| `--danger` | `#F04438` | 지출, 에러, 음수 | 컨벤션. 그린과 명도 차 충분(루미넌스 51 vs 70 ≒ 19 차이) → 색맹 안전 |
| `--warning` | `#F79009` | 경고, 예산 임박 | 컨벤션 |
| `--info` | `#0099FF` (브랜드 블루 재사용) | 안내, 도움말 | BPL |

### 2.4 차트 팔레트 (5색 순환)

```
1. #00CD80 (green)   — 1순위(가장 큰 카테고리)
2. #0099FF (blue)    — 2순위
3. #F582C6 (pink)    — 3순위
4. #00CDCD (cyan)    — 4순위
5. #F79009 (amber)   — 5순위 / "기타"
```

> **접근성 원칙**: 빨강/초록 대비는 단순 색상이 아닌 **명도 차**로 구분되어야 함. 색맹 사용자도 인식 가능하게. (Banksalad 자체 가이드라인 일치)

### 2.5 다크모드
- 라이트는 1차, 다크는 동등 우선순위 (시스템 prefers-color-scheme + 사용자 토글).
- 다크에서 `--brand-green`은 그대로 사용해도 명도 충분. 단, 큰 면적의 텍스트엔 약간 lighten한 `#33D894` 옵션 변형 검토.
- 카드 배경은 다크에서 페이지보다 약간 밝게(`#1C1F26` vs `#15171D`) — 입체감 유지.

---

## 3. 타이포그래피

### 3.1 폰트 패밀리
- **본문 / 모든 한글**: Pretendard (확정, BPL 공식)
- **숫자 강조**: Pretendard의 `font-feature-settings: 'tnum' 1` (tabular numerals) — 별도 폰트 불필요. 금액 정렬 시 숫자 폭이 일정해야 함.
- 시스템 폴백: `system-ui, -apple-system, "Apple SD Gothic Neo", BlinkMacSystemFont, sans-serif`

### 3.2 타입 스케일

| 토큰 | size / line-height / weight | 용도 | 예시 |
|------|------------------------------|------|------|
| `display-xl` | 40 / 48 / 800 (ExtraBold) | 자산 총액, 주요 KPI | "₩12,345,000" |
| `display-l` | 32 / 40 / 800 | 화면 제목 | "이번 달 지출" |
| `heading-l` | 24 / 32 / 700 (Bold) | 섹션 제목 | "최근 거래" |
| `heading-m` | 20 / 28 / 700 | 카드 헤더 | |
| `heading-s` | 18 / 24 / 600 (SemiBold) | 리스트 그룹 헤더 | "4월 28일" |
| `body-l` | 16 / 24 / 400 (Regular) | 본문 기본 | |
| `body-m` | 14 / 20 / 400 | 보조 본문 | |
| `body-s` | 13 / 18 / 400 | 메모, 부가 설명 | |
| `caption` | 12 / 16 / 500 (Medium) | 캡션, 카테고리 칩 | |
| `amount-l` | 28 / 36 / 800, tnum | 카드 내부 큰 숫자 | "₩430,000" |
| `amount-m` | 18 / 24 / 700, tnum | 거래 항목 금액 | |

### 3.3 핵심 위계 원칙
- **숫자가 라벨보다 항상 굵고 크다**. 레퍼런스 핵심: "bank" 굵게 + "salad" 가늘게의 weight contrast를 금액 vs 라벨에 적용.
- 헤딩은 ExtraBold, 본문은 Regular — Bold 중간 단계는 절제.
- 화면당 폰트 크기 종류 5개 이내.

---

## 4. 스페이싱 / 레이아웃

### 4.1 스페이싱 스케일 (4의 배수)
```
0   2   4   8   12   16   20   24   32   40   48   64
```
Tailwind 기본과 일치 (`gap-3` = 12px, `p-4` = 16px). BPL `109_Spacing/Height12`도 12 단위 사용 — 호환됨.

### 4.2 컨테이너
- **모바일 최대**: 640px (PWA 풀폭, 좌우 패딩 16px)
- **데스크탑 콘텐츠 폭**: 720px (단일 컬럼) ~ 1120px (대시보드)
- **태블릿/대형 모바일**: 모바일 레이아웃 그대로 (가운데 정렬, 좌우 빈 공간).

### 4.3 그리드
- 모바일: 1열 카드 스택, 카드 간 `gap-3` (12px)
- 데스크탑 대시보드: 2~3열 CSS Grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- 폼: 단일 컬럼 풀폭, 라벨 위 / 인풋 아래 패턴.

### 4.4 안전 영역
- iOS: `padding-bottom: env(safe-area-inset-bottom)` 하단 네비에 적용
- 상태바: `padding-top: env(safe-area-inset-top)` 헤더에 적용

---

## 5. 모서리 반지름 (Border Radius)

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--radius-sm` | 6px | 작은 칩, 태그 |
| `--radius-md` | 12px | 버튼, 인풋 |
| `--radius-lg` | 16px | 카드, 시트 |
| `--radius-xl` | 20px | Bottom Sheet 상단 |
| `--radius-full` | 9999px | 아바타, 토글, 동그란 칩 |

> **원칙**: 모든 반지름은 6 / 12 / 16 / 20 / full만 사용. 임의값(예: 10px) 금지.

---

## 6. 그림자 (Elevation)

뱅크샐러드 패턴 분석 결과: **그림자는 거의 안 씀**. 대신 1px 디바이더와 여백으로 입체감을 만든다. Material 스타일 강한 그림자는 회피.

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--shadow-none` | `none` | 기본 카드 (디바이더만) |
| `--shadow-soft` | `0 2px 8px rgba(15, 17, 21, 0.04)` | 떠 있어야 하는 카드 (Bottom Sheet 진입 직전) |
| `--shadow-pop` | `0 8px 24px rgba(15, 17, 21, 0.08)` | 모달, 팝오버 |
| `--shadow-fab` | _사용 안 함_ | FAB 미채택 |

다크모드에서는 그림자 대신 `border` 1px (#262932)로 분리.

---

## 7. 아이코노그래피

### 7.1 시스템 아이콘
- **Lucide Icons**(shadcn 기본). 라이브러리 통일.
- 스타일: **선(line) 1.5px stroke**. filled는 활성/선택 상태에만 (탭바 active 등).
- 크기 토큰: `icon-sm` 16px, `icon-md` 20px, `icon-lg` 24px, `icon-xl` 32px.

### 7.2 카테고리 아이콘
- **컬러 라운드 컨테이너 + 모노 아이콘** 조합.
- 컨테이너: 36×36 또는 40×40, `rounded-full` 또는 `rounded-md` (12px), 카테고리 색의 옅은 톤(`bg-{color}-100` 식, 알파 0.12).
- 내부 아이콘: 카테고리 색 풀톤(`#00CD80` 등) Lucide 아이콘.
- 예: 🍴 식비 → 그린 톤 컨테이너 + `Utensils` 아이콘 / 🚗 교통 → 블루 톤 컨테이너 + `Car`.

### 7.3 일러스트 (Empty State 등)
- 인라인 SVG 단순 일러스트 (3색 이내, 브랜드 컬러 사용).
- 외부 일러스트 라이브러리 의존 X. 화면당 1개 이내.
- 캐릭터 마스코트 X (뱅크샐러드도 캐릭터 안 씀; 그릇/스마일이 유일).

---

## 8. 컴포넌트 원칙

### 8.1 Card
- 기본: `bg-card`, `rounded-lg`(16px), `p-4`(16px), 그림자 없음, `border` 없음.
- 카드끼리 12px 간격으로 스택.
- 헤더가 필요하면: 좌측 제목(heading-m) + 우측 "더보기" 텍스트 버튼(text-secondary, body-s).
- 클릭 가능 카드: `hover:bg-muted/50 active:scale-[0.98]` 미세 인터랙션.

### 8.2 Button
- **Primary**: `bg-brand-green`, white text, `rounded-md`(12px), `h-12`(48px) full-width on mobile, ExtraBold label.
- **Secondary**: `bg-muted`, text-primary, 같은 사이즈/모서리.
- **Ghost**: 투명 배경, hover시 `bg-muted/50`.
- **Destructive**: `bg-danger`, white text.
- 모서리: **rounded rectangle**(12px). pill(`rounded-full`) 메인 CTA에 사용 X.
- 아이콘 버튼: 정사각 40×40, `rounded-md` 또는 `rounded-full`.

### 8.3 List Item (거래 항목)
```
[icon-container]  [title          ]  [amount        ]
                  [category·memo  ]  [date·time(opt)]
```
- 좌측 카테고리 아이콘 컨테이너 (40×40)
- 중앙 2줄: 거래처/제목(body-l, weight 500) + 카테고리·메모(body-s, text-secondary)
- 우측: 금액(amount-m, tabular-nums, 양수=success/음수=danger) + 시간(caption, text-tertiary, 옵션)
- 패딩: `py-3 px-4`. 사이 디바이더 1px `border` 또는 12px gap.
- swipe 액션 (편집/삭제) — 모바일에서 좌→우 스와이프

### 8.4 Bottom Sheet (핵심 패턴)
- 데스크탑: shadcn `Dialog`로 폴백. 모바일: shadcn `Drawer`.
- 상단 `rounded-t-xl`(20px), 드래그 핸들 1.5px × 36px, `bg-text-tertiary/40`.
- 진입 시 페이지 dim `bg-black/40`.
- 거래 입력, 카테고리 선택, 필터 등 모달 작업 대부분이 시트.

### 8.5 Bottom Navigation (4탭)
- `fixed bottom-0`, `h-16`(64px) + `safe-area-inset-bottom`.
- 4개 아이콘: **홈 / 가계부 / 자산 / 설정**.
- 활성 탭: 아이콘 filled 변형 + 라벨 `text-brand-green` + body-s weight 600.
- 비활성: 아이콘 line + 라벨 `text-text-tertiary`.
- 데스크탑(≥md): 좌측 사이드바로 전환 (같은 4항목, 세로).

### 8.6 Top Navigation
- `h-14`(56px), 좌측 제목 또는 뒤로가기 + 우측 액션 아이콘 1~2개.
- 스크롤 시 그림자 X, 대신 `border-b` 1px가 페이드인.

### 8.7 Empty State
- 화면 가운데 정렬, 일러스트(120×120) + 헤딩(heading-m) + 본문(body-m, text-secondary) + CTA 버튼 1개.
- 카피 톤: "아직 기록이 없어요. 첫 거래를 추가해 볼까요?"

### 8.8 Form Input
- 라벨 위 / 인풋 아래 패턴.
- 인풋: `h-12`, `rounded-md`(12px), `bg-muted` 배경(border 없음) 또는 `border` 1px (선호도에 따라 — Phase 1 결정). focus 시 `ring-2 ring-brand-green/30`.
- 금액 입력은 `inputMode="decimal"`, 큰 폰트(amount-l), 우측 정렬, ₩/$ 기호 prefix.

### 8.9 Chart
- **라이브러리**: Recharts (MVP 문서 일치).
- **도넛**: 자산 분포, 카테고리 비율. 두께 32px, 안쪽 라벨 X(범례를 카드 아래 칩 형태로).
- **라인/영역**: 순자산 추이. 그린 stroke 2px, 영역 fill `brand-green/8`.
- **바**: 일별 지출, 전월 대비. 둥근 상단(`radius=[6,6,0,0]`), 카테고리 색 사용.
- 모든 차트는 `tabular-nums`로 축 라벨.

### 8.10 Calendar (가계부)
- shadcn `Calendar`(react-day-picker) 커스터마이징.
- 각 날짜 셀에 일 합산 텍스트(caption, 양수 success / 음수 danger) 배치.
- 선택 시 시트로 해당 일 거래 상세.

---

## 9. 인터랙션 / 모션

- **트랜지션 기본값**: `duration-150 ease-out` (대부분), `duration-300` (시트 진입/퇴장).
- **press 피드백**: `active:scale-[0.98]` 또는 `active:bg-muted` — 가벼움 우선.
- **로딩**: 스켈레톤(card outline + shimmer)이 1차, 풀스크린 스피너는 회피.
- **토스트**: `sonner` 라이브러리, 우상단(데스크탑) / 하단 시트 위(모바일) 4초 자동 dismiss.
- **햅틱**: `navigator.vibrate(10)` (Android Chrome). 거래 저장/완료 시.

---

## 10. 접근성

- WCAG AA 명도 대비: 본문 4.5:1 이상, 헤딩 3:1 이상.
- 빨강/초록 의존 X — 항상 색 + 텍스트 또는 색 + 아이콘 조합.
- 모든 인터랙션 요소 키보드 포커스 가능, `focus-visible:ring`.
- 한국어 스크린리더(VoiceOver/TalkBack) 호환 — 금액은 `aria-label="만 이천 원 지출"` 처럼 한국어로.
- Pretendard는 굵은 한글에서도 가독성 좋음. font-size 최소 14px(body-m) 유지.

---

## 11. shadcn/ui 커스터마이징 계획

### 11.1 그대로 쓰기
`Button`, `Card`, `Input`, `Label`, `Sheet`/`Drawer`, `Dialog`, `Tabs`, `Calendar`, `Toast`(sonner), `Popover`, `Select`, `Skeleton`, `Switch`, `Separator`, `Avatar`, `Badge`.

### 11.2 커스텀 신규
- `BottomNav` — 4탭 하단 네비
- `ListItem` — 거래 항목 (위 8.3 스펙)
- `CategoryIcon` — 컬러 컨테이너 + Lucide 아이콘 조합
- `AmountDisplay` — 금액 표시 (양수/음수 색, tabular-nums)
- `EmptyState` — 일러스트 + 카피 + CTA
- `MetricCard` — 대시보드 KPI 카드 (큰 숫자 + 변동 화살표)
- `DateGroupHeader` — 거래 목록 sticky 헤더

### 11.3 테마 변수 (`globals.css` 초안)
```css
@layer base {
  :root {
    --background: 0 0% 100%;             /* #FFFFFF */
    --foreground: 230 10% 18%;           /* #2A2B33 */
    --card: 0 0% 100%;
    --card-foreground: 230 10% 18%;
    --muted: 220 14% 96%;                /* #F2F4F7 */
    --muted-foreground: 220 9% 46%;      /* #6B7280 */
    --border: 220 13% 94%;               /* #EEF0F3 */
    --input: 220 13% 94%;
    --ring: 156 100% 40%;                /* brand-green */

    --primary: 156 100% 40%;             /* #00CD80 */
    --primary-foreground: 0 0% 100%;
    --secondary: 220 14% 96%;
    --secondary-foreground: 230 10% 18%;
    --destructive: 4 86% 58%;            /* #F04438 */
    --destructive-foreground: 0 0% 100%;

    /* 브랜드 액센트 (브랜드 팔레트 + 차트) */
    --brand-green: 156 100% 40%;         /* #00CD80 */
    --brand-blue: 204 100% 50%;          /* #0099FF */
    --brand-cyan: 180 100% 40%;          /* #00CDCD */
    --brand-pink: 327 84% 74%;           /* #F582C6 */

    --radius: 0.75rem;                   /* 12px (md) */
  }

  .dark {
    --background: 222 17% 7%;            /* #0F1115 */
    --foreground: 220 13% 92%;           /* #E8EAEE */
    --card: 224 14% 13%;                 /* #1C1F26 */
    --card-foreground: 220 13% 92%;
    --muted: 224 13% 14%;
    --muted-foreground: 220 9% 65%;
    --border: 222 11% 18%;
    --input: 222 11% 18%;
    --ring: 156 100% 45%;

    --primary: 156 100% 42%;
    --primary-foreground: 222 17% 7%;
    --destructive: 4 86% 58%;
    --destructive-foreground: 0 0% 100%;
  }
}
```

### 11.4 Tailwind 설정 (`tailwind.config.ts` 초안)
```ts
export default {
  darkMode: ['class'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard Variable', 'Pretendard', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          green: 'hsl(var(--brand-green))',
          blue:  'hsl(var(--brand-blue))',
          cyan:  'hsl(var(--brand-cyan))',
          pink:  'hsl(var(--brand-pink))',
        },
        // 나머지는 shadcn 기본 magic var 사용
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '16px',
        xl: '20px',
      },
      fontSize: {
        'display-xl': ['40px', { lineHeight: '48px', fontWeight: '800' }],
        'display-l':  ['32px', { lineHeight: '40px', fontWeight: '800' }],
        'heading-l':  ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'heading-m':  ['20px', { lineHeight: '28px', fontWeight: '700' }],
        'heading-s':  ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'body-l':     ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-m':     ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-s':     ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'caption':    ['12px', { lineHeight: '16px', fontWeight: '500' }],
        'amount-l':   ['28px', { lineHeight: '36px', fontWeight: '800' }],
        'amount-m':   ['18px', { lineHeight: '24px', fontWeight: '700' }],
      },
      boxShadow: {
        soft: '0 2px 8px rgba(15, 17, 21, 0.04)',
        pop:  '0 8px 24px rgba(15, 17, 21, 0.08)',
      },
    },
  },
};
```

### 11.5 Pretendard 로딩
```tsx
// app/layout.tsx
import localFont from 'next/font/local';

const pretendard = localFont({
  src: '../public/fonts/PretendardVariable.woff2',
  variable: '--font-pretendard',
  display: 'swap',
});
```
또는 CDN: `https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable.css`. 자체 호스팅 권장(서브셋 가능).

---

## 12. 우리 프로젝트 적용 결정 표

| 패턴 | 적용 | 비고 |
|------|------|------|
| 4탭 하단 네비 (홈/가계부/자산/설정) | ✅ | 5탭에서 "금융탐색" 제거 |
| 데이터-퍼스트 홈 | ✅ | KPI 카드 → 최근 거래 → 카테고리 Top |
| 일별 헤더 그루핑 | ✅ | sticky |
| 카테고리 자동 학습 (3회 룰) | ✅ | 클라이언트 캐시 |
| 도넛 + 라인 자산 차트 | ✅ | Recharts |
| 단일 시트형 거래 추가 | ✅ | Drawer |
| 친근한 마이크로 카피 + 토스트 | ✅ | sonner |
| Empty State 일러스트 | ✅ | 인라인 SVG |
| CSV/JSON export | ✅ | 신뢰의 핵심 |
| 또래 자산 순위 | ❌ | 데이터 풀 없음 |
| 금융 상품 추천 마켓플레이스 | ❌ | 수익화 안 함 |
| 마이데이터 자동 동기화 카피 | ❌ | 거짓 약속 |
| 샐러드게임/팀 미션 | ❌ | 멀티유저 없음 |
| 캐릭터 마스코트 | ❌ | Banksalad도 안 씀 |
| FAB | ❌ | Bottom Sheet 진입 버튼이 헤더 또는 빈 상태 CTA |

---

## 13. Phase 1 체크리스트 (이 문서 다음 단계)

- [ ] `pnpm dlx create-next-app@latest asset-management --typescript --tailwind --app`
- [ ] `pnpm dlx shadcn@latest init` — 위 11.3 CSS 변수로 덮어쓰기
- [ ] Pretendard variable woff2 다운로드 → `public/fonts/`
- [ ] `tailwind.config.ts`에 11.4 토큰 적용
- [ ] `app/layout.tsx`에 폰트 + `dark` 클래스 토글
- [ ] shadcn add: `button card input label sheet drawer dialog tabs calendar popover select skeleton switch separator avatar badge sonner`
- [ ] 커스텀 컴포넌트 6개 스캐폴딩 (`BottomNav`, `ListItem`, `CategoryIcon`, `AmountDisplay`, `EmptyState`, `MetricCard`, `DateGroupHeader`)
- [ ] 디자인 토큰 검증: 라이트/다크 색 대비 자동 체크 스크립트(WCAG AA)
- [ ] 스토리북 또는 `/dev/preview` 라우트에서 컴포넌트 카탈로그

---

## 14. 한계와 후속 검증

이 문서는 **공개 자료 기반 추정**이 일부 섞여 있습니다. 정확도 향상을 위해 추후 보완할 것:

| 항목 | 현재 신뢰도 | 검증 방법 |
|------|------------|----------|
| 코어 브랜드 hex 5종 | high | BPL 블로그 SVG 그대로 사용 |
| Pretendard 폰트 | high | 공식 명시 |
| 뉴트럴 그레이 스케일 | medium | 컨벤션 — 실제 앱 스크린샷 픽셀 추출 시 보정 |
| 시멘틱 색 (danger #F04438) | medium | 한국 핀테크 표준, 실측 시 대체 가능 |
| 컴포넌트 모서리 12/16/20 | medium | BPL 명시 없음, 시각 관찰 기반 |
| 그림자 강도 | medium | 관찰 기반 ("거의 없음") |
| 타입 스케일 정확값 | low | 자체 결정. 사용 중 실측 조정 |
| 다크모드 색 매핑 | low | 본 문서 자체 설계 (Banksalad 다크 디자인은 부분 공개) |

설치 후 사용자가 앱을 직접 깔 수 있게 되면, 핵심 화면을 캡처하여 픽셀 단위로 토큰 보정 1회 권장.

---

## 15. 자료 출처

### 공식
- [BPL Design System 글](https://blog.banksalad.com/tech/banksalad-product-language-design/) — 컴포넌트 642개, 재사용률 85% 출처
- [BPL iOS 구현](https://blog.banksalad.com/tech/banksalad-product-language-ios/)
- [Pretendard 사용 명시](https://blog.banksalad.com/tech/font-preload-on-safari/)
- [홈 리디자인 시리즈 1](https://blog.banksalad.com/tech/building-brand-new-home-1/) / [2](https://blog.banksalad.com/tech/building-brand-new-home-2/) / [3](https://blog.banksalad.com/tech/building-brand-new-home-3/)
- [접근성 글](https://blog.banksalad.com/tech/the-illusion-of-supporting-accessibility/)
- [샐러드게임 UX 글](https://blog.banksalad.com/tech/banksalad-saladgame-2/)
- [Banksalad GitHub](https://github.com/banksalad)

### 비교 / 분석 (Brunch, Weekly UX/UI)
- [뱅크샐러드와 토스의 차이](https://brunch.co.kr/@jwj8906/14)
- [토스뱅크 vs 뱅크샐러드 UIUX 비교](https://brunch.co.kr/@7217b71f43c34f7/94)
- [뱅크샐러드, 토스 - 소비/가계부 비교](https://weeklyuxuichallenge.oopy.io/f9b6105e-9473-42ca-bfa3-295c6ee086a5)
- [잘 녹인 UX Writing](https://brunch.co.kr/@positive-kim/58)
- [뱅크샐러드 사용자 1,081명 인터뷰](https://brunch.co.kr/@banksalad/298)

### 브랜드 / 리브랜딩
- [BX 매니저 인터뷰 (테크엠)](https://www.techm.kr/news/articleView.html?idxno=79930)
- [2018 1차 로고 교체 (전자신문)](https://www.etnews.com/20181203000273)
- [2021 사명 변경 + CI](https://www.sedaily.com/NewsView/22H870ZITD)
- [WWIT 디자인 갤러리](https://wwit.design/2021/02/16/banksalad/)

### 시각 자료
- [App Store KR](https://apps.apple.com/kr/app/뱅크샐러드/id1195804784)
- [Play Store KR](https://play.google.com/store/apps/details?id=com.rainist.banksalad2)
- [Banksalad Instagram](https://www.instagram.com/banksalad/)

### 비교 대상
- [Toss 브랜드 심볼](https://toss.tech/article/43061)
- [Mint vs YNAB](https://moneywise.com/managing-money/budgeting/mint-vs-ynab)
