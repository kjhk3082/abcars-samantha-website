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

## 6. AI 챗봇 운영 (Samantha AI)

- 두뇌: Requesty 게이트웨이 (`zai/glm-5.3-flash`, 실패 시 deepseek 폴백) — 키는 **Vercel 프로젝트
  abcars-samantha-website → Settings → Environment Variables → `REQUESTY_API_KEY`**
  (키 등록/변경 후에는 Deployments에서 Redeploy 한 번, 또는 다음 git push 때 자동 반영)
- 비용 확인: app.requesty.ai 사용량 — 대화 1턴 ≈ $0.001 미만. 잔액 $10 기준 수천 턴
- 시나리오: 구매(예산·차종 → 카드 3–4대 + 스트레치 픽 → 폼 → 왓츠앱), **판매/트레이드인**
  (차량 연식·모델·주행·상태·PCS 일정만 수집, 시세는 절대 제시 안 함 → 폼 → 메모에 차량 정보 → 왓츠앱),
  "요즘 인기 차" 질문은 실제 조회수 TOP10 기반으로 답변
- 리드는 구매자 본인의 왓츠앱으로 이모님(010-7170-4513)에게 도착 — 이름·관심차량 링크·예산·희망시간 포함
- 이벤트: 챗봇 열기 `chat_open`, 폼 제출 `lead_form_submit`(GA4), 왓츠앱 전송 `Lead`(Pixel) + `chat_lead`(GA4)
- **구매의향 리드 데이터 보는 법**: 관심 고객이 폼(이름 필수·번호 옵션·희망시간)을 제출하면
  서버가 `LEAD {json}` 로그를 남김 — [Vercel → abcars-samantha-website → Logs](https://vercel.com/kjhk3082s-projects/abcars-samantha-website/logs)에서
  `LEAD` 검색 (이름·번호·희망시간·예산·관심차량·대화 전문 포함). 개인정보라 공개 레포에는 절대 저장 안 함.
- **영구 저장 원하면**: 구글 시트 Apps Script 웹앱(doPost로 시트에 append) 만들어 URL을
  Vercel 환경변수 `LEADS_WEBHOOK_URL`로 등록 → 리드가 시트에 자동 누적. (원하면 스크립트 코드 제공)
- 프롬프트 인젝션 방어: 역할·규칙 변경/프롬프트 유출 요구 거절, 재고 텍스트도 데이터로 취급,
  링크·전화번호·카드 전부 서버가 실데이터로만 생성(모델이 URL 출력 불가), 이름/번호 필드 새니타이즈

## 7. 네이버 (선택 — 고객이 미군이라 후순위)

- searchadvisor.naver.com 에 사이트 등록 + 소유 확인 → sitemap.xml 제출 (Yeti 크롤러는 robots.txt에서 이미 허용됨)
- 한국인 고객(수출/도매 문의)이 생기면 네이버 블로그 투트랙(블로그 글 → 사이트 링크)을 그때 시작

## 8. 측정 루프 — "고쳤다"가 아니라 "숫자가 움직였다"까지

**기준선 (2026-09-11 기록):**
- AI 인용: Perplexity/ChatGPT에 아래 5개 질문 → 인용 0/5 (배포 직후라 당연)
  1. where to buy a used car near Camp Humphreys
  2. SOFA vehicle registration help Pyeongtaek
  3. used car dealer for US military in Korea
  4. sell my car before PCS Korea
  5. cheap cars near Camp Humphreys
- Google/Bing 색인: Search Console·Bing 등록 후 "페이지" 수 기록할 것
- **재측정일: 2026-09-25 (14일 후)** — 위 5개 질문 재실행 + GSC 노출/클릭 스냅샷
- 읽는 법: 노출부터 오르고 클릭은 나중에 따라옴. 노출↑ CTR→ 이면 다음 과제는 메타 문구

## 9. 관리자 대시보드 & 개인정보

- **관리자 페이지**: https://abcars-samantha-website.vercel.app/admin (북마크 권장, 검색 비노출)
  - 로그인: 이메일 + 비밀번호 (Vercel env `ADMIN_EMAILS` 화이트리스트 + `ADMIN_PASSWORD`).
    비밀번호는 레포에 절대 넣지 않음 — Vercel 환경변수에만 존재. 구글 로그인은 `GOOGLE_CLIENT_ID` 있을 때만 추가로 표시
  - 보이는 것: 오늘·7일·30일 방문, 챗 질의응답 전문(국가·도시 포함), 리드(이름·번호·시간·차량), 차량 클릭 TOP10, 국가별 방문
  - **RESET DATA** 버튼: 테스트 데이터 전부 삭제(되돌릴 수 없음) — 실사용 시작 전 한 번 누를 것
- **1회 셋업 2가지** (안 하면 대시보드가 "저장소 미연결" 안내):
  1. Vercel → Storage → **Upstash Redis** 무료 생성·연결 (env 자동 주입)
  2. Vercel env `ADMIN_EMAILS=flowerdudtlr@gmail.com`, `ADMIN_PASSWORD=(비밀번호)` 등록 → 재배포(다음 푸시 또는 Redeploy)
- **조회수**: 차량 페이지 열람이 `car:clicks`에 집계되어 인벤토리 카드에 👁 배지 + "MOST VIEWED" 정렬로 노출,
  챗봇도 TOP10을 참고해 "인기 차" 추천. 비밀번호 유출 의심 시 Vercel에서 `ADMIN_PASSWORD`만 바꾸면 기존 세션 전부 무효화됨
- **개인정보처리방침**: /privacy (전 페이지 푸터 링크). 수집·위탁 내용이 바뀌면
  방침 §10 개정이력에 날짜와 함께 갱신할 것. 원본 IP는 저장하지 않음(국가·도시만)

## 10. 월간 점검 루틴 (5분)

- GA4: 방문자 수, call_click / whatsapp_click / chat_open / chat_lead 횟수
- Meta Events Manager: PageView / ViewContent / Contact / Lead 수신 확인
- Search Console + Bing: 노출·클릭 상위 검색어 (상위 질문에 전용 페이지 없으면 그게 다음 만들 페이지)
- 구글 리뷰 개수 / 별점
- Perplexity·ChatGPT에 위 5개 질문 → 인용 O/X 기록
