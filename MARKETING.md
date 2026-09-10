# Samantha Used Car — 마케팅 플레이북

사이트의 기술적 GEO/SEO(정적 차량 페이지, sitemap, llms.txt, 스키마)는 자동화되어 있습니다.
아래는 **사람이 해야 하는** 성장 작업 목록입니다. 위에서부터 순서대로 하면 됩니다.

---

## 1. 구글 비즈니스 프로필 (최우선 — 로컬 노출의 80%)

리스팅: "Samantha Used Car" (https://share.google/ijwjuQSWa4WooSU4q)

- [ ] 비즈니스 인증(전화/엽서) 완료하기
- [ ] **웹사이트에 `https://samanthausedcar.com` 등록**
- [ ] 영업시간 입력: 월–금 9–18 / 토 9–17 / 일 9–16
- [ ] 사진 10장 이상 업로드 (매장 외관·간판·차량·이모님 프로필 — 외관 사진이 지도 클릭률을 크게 올림)
- [ ] 카테고리: Used car dealer / 서비스 지역: Pyeongtaek, Camp Humphreys
- [ ] **리뷰 요청 루틴 만들기**: 차 인도할 때 아래 문구를 왓츠앱으로 전송
  > Thanks for choosing Samantha Used Car! 🚗 If you have a minute, a Google review
  > helps other soldiers find us: (프로필의 "리뷰 요청" 짧은 링크 붙여넣기)
  - 리뷰 5개가 쌓이면 별점이 노출되기 시작합니다. 월 2–3개가 목표.

## 2. 검색엔진 등록 (30분, 1회성)

- [ ] **Google Search Console** (https://search.google.com/search-console)
  - 속성 추가 → 도메인 `samanthausedcar.com` → DNS TXT 인증 (가비아 DNS에 TXT 레코드 1줄 추가)
  - 등록 후: Sitemaps 메뉴 → `https://samanthausedcar.com/sitemap.xml` 제출
- [ ] **Bing Webmaster Tools** (https://www.bing.com/webmasters) — *ChatGPT 검색·Copilot이 Bing 인덱스를 씀*
  - "Import from Google Search Console" 버튼으로 1분 완료
- [ ] 2주 후 Search Console "페이지" 메뉴에서 cars/ 페이지 색인 수 확인

## 3. 페이스북 채널 (이모님의 주력 채널 강화)

- [ ] 페이지 정보 업데이트: 웹사이트 `samanthausedcar.com`, 이메일 flowerdudtlr@gmail.com, 새 주소 (아직 옛 정보가 남아있음)
- [ ] **차량 포스팅 공식 바꾸기**: 사진 + 짧은 설명 + **차량 정적 링크** (`samanthausedcar.com/cars/차량번호.html`)
  - 링크를 붙이면 사진·가격이 포함된 미리보기 카드가 자동 생성됨 (왓츠앱도 동일)
- [ ] **Camp Humphreys 커뮤니티 그룹**에 주 1–2회 포스팅 (그룹 규칙 준수, 도배 금지):
  - "Camp Humphreys Buy/Sell/Trade", "Pyeongtaek-Humphreys Community", "USFK Cars for Sale" 계열 그룹 검색해서 3–4개 가입
- [ ] **FB Marketplace**에 대표 차량 5–10대 등록 (설명 끝에 사이트 링크)

## 4. 오프라인 접점

- [ ] 명함 재인쇄 시 수정 3가지: WhatsApp `+82-10-…`, 주소 `186-3 Songhwa 2-gil`, 웹 주소 추가
- [ ] 매장/차량에 QR 스티커 (digital card 페이지의 왓츠앱 QR 활용 가능)

## 5. 유료 광고 (무료 채널이 자리 잡은 뒤, 선택)

측정 기반이 이미 깔려 있음: GA4에서 `call_click` / `whatsapp_click` 이벤트로 전환 추적 중.

- **Google 검색광고**: 키워드 "used car camp humphreys", "buy car pyeongtaek military",
  "SOFA car registration" — 일 $5–10로 2주 테스트 → GA4 전환당 비용 확인 후 유지/중단
- **FB 게시물 부스트**: 잘 나가는 차량 포스트에 $10–20, 타깃 = Pyeongtaek 반경 15km, 영어 사용자, 20–45세
- 판단 기준: 전화+왓츠앱 클릭 1건당 $5 이하면 합격

## 6. 월간 점검 루틴 (5분)

- GA4: 방문자 수, call_click / whatsapp_click 횟수
- Search Console: 노출·클릭 상위 검색어
- 구글 리뷰 개수 / 별점
- Perplexity·ChatGPT에 "where to buy a used car near Camp Humphreys" 물어보고 인용되는지 확인
