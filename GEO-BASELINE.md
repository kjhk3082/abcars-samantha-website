# GEO Baseline — 2026-09-14

`fire-your-seo-agency` 스킬 절차(진단 → 구현 → 측정)로 수행한 AI 검색 최적화 작업 기록.
**재측정 예정일: 2026-09-28 (변경 후 14일)**

## 기준선 (2026-09-14 측정)

- 색인: 브랜드 검색("Samantha Used Car Camp Humphreys")에 홈페이지 노출됨 ✅
- SSR: 전 페이지 정적 HTML, h1 존재 ✅ / noindex 없음 ✅ / 404 정상 ✅
- 사이트맵: 145 URL (차량 139 포함) — 작업 후 148 URL
- AI 크롤러 정책: robots.txt 전면 Allow ✅ (GPTBot·ClaudeBot·PerplexityBot 등)
- llms.txt: 재고 목록 자동 갱신 ✅ — 작업 후 가이드 링크 추가
- 구조화 데이터: AutoDealer·Vehicle·FAQPage ✅ — 작업 후 BreadcrumbList·aggregateRating 추가
- 의도 랜딩 페이지: 0개 — 작업 후 3개
- AI 인용: 대상 질문(아래) 인용 여부 미측정 (0/N 가정)
- 네이버: 미등록 — 고객이 미군·SOFA(영어권)라 우선순위 낮음. 필요 시 Search Advisor 등록.

## 실측 (2026-09-15)

- **Google `site:samanthausedcar.com` → 1건만 색인(홈페이지뿐).** 차량 139페이지·FAQ 미색인.
  GSC 미등록 상태(구글 검색 결과에 "웹마스터이십니까?" 안내 노출). → 색인이 최우선 병목.
- **Bing 일반어 검색 "used car dealer near Camp Humphreys SOFA military" → Samantha 0건.**
  상위 노출 경쟁사: humphreyscars.com, sofacarsky.com, abcars.org, tayomotors.net,
  carmaxcenter.com, resalelot.org. 지도 팩: Blue Ocean/SOFA CAR SKY/CarMax/KI MOTORS.
  (KI MOTORS·SOFA CAR SKY가 같은 주소 186-3 Songhwa 2-gil — 같은 매장 부지의 별도 브랜드들)
- **Perplexity**: 테스트 환경(무로그인 브라우저)에서 로그인 요구됨 — 재측정은 로그인된 환경에서.

결론: 온사이트(콘텐츠·스키마)는 준비 완료. 현재 병목은 ① 검색엔진 색인(GSC·Bing WMT 등록)
② 외부 corroboration(리뷰·커뮤니티 언급) ③ 시간(색인→인용까지 2~6주).

## 대상 질문 8개 (AI 인용 테스트용)

1. Where can I buy a used car near Camp Humphreys?
2. How much does a used car cost near Camp Humphreys?
3. How does SOFA vehicle registration work in Korea?
4. Who handles SOFA car registration paperwork near Camp Humphreys?
5. How do I sell my car before PCS from Camp Humphreys?
6. Where can I junk my car near Camp Humphreys?
7. Used car dealer near Camp Humphreys with warranty?
8. Recommend a used car dealer for US military in Pyeongtaek

테스트 방법: Perplexity·ChatGPT(검색 모드)에 질문 → 출처에 samanthausedcar.com이 뜨는지 O/X 기록.

## 2026-09-14 변경 사항

- 신규: `buy-used-car-camp-humphreys.html` / `sofa-car-registration.html` / `sell-car-pcs.html`
  (질문=페이지 원칙, 첫 문단 직답, 표·단계, FAQPage+BreadcrumbList JSON-LD)
- `index.html`: 히어로 첫 문단을 사실 기반 직답으로 교체, AutoDealer에 aggregateRating(4.8·231) 추가, GUIDES 섹션 추가
- 차량 페이지 전체: 가시 브레드크럼 + BreadcrumbList JSON-LD (생성기 `scripts/sync_vehicles.py`·`scripts/car_template.html` 수정 → 3시간 동기화에도 유지됨)
- `sitemap.xml` 148 URL, `llms.txt`에 가이드 링크 추가 (생성기가 매 동기화마다 유지)
- `README.md`: 옛 주소(Anjeong-ro) 제거 — 엔티티 일관성

## 재측정 시 확인할 것

- [ ] 위 8개 질문 인용 O/X (Perplexity·ChatGPT 각각)
- [ ] Google Search Console: 노출·클릭 28일 비교
- [ ] Bing WMT: site:samanthausedcar.com 색인 수, 가이드 3종 색인 여부
- [ ] Vercel 로그/대시보드: AI 크롤러(GPTBot·PerplexityBot·ClaudeBot) 방문 추이
- [ ] MARKETING.md 체크리스트 진행 상황 (GSC·Bing WMT 등록은 계정 작업)

## 하지 않은 것 (원칙)

- 백링크 구매·키워드 채우기·숨김 텍스트 없음 — 정공법만
- 화면에 없는 사실을 JSON-LD에 넣지 않음 (aggregateRating은 푸터의 "★ 4.8 · 231"과 일치)
- 네이버(NEO): 고객층이 영어권 미군이라 보류 — 한국어 고객이 늘면 Search Advisor 등록으로 확장
