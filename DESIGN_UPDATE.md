# KNOCK 디자인 변경 및 검수

기준: `reference/KNOCK_Design_3_Options/KNOCK_Final_Designs.png`의 03 단계별 안내형, 28개 화면.

## 기존 구조 분석

- React 19 + Vite 6 + React Router 7. `src/App.jsx`의 기존 라우트 유지.
- `Layout.jsx`는 PC 고정 사이드바·헤더, 모바일 헤더·하단 내비게이션을 제공한다.
- 기존 전역 CSS와 HomePage CSS를 보존하고 `reference.css`에서 디자인을 적용한다. 기존 시스템 폰트와 lucide-react 아이콘을 재사용한다.
- `KnockContext.jsx`의 Context/useState로 상황·목표·상대, 동의, 세션, 기록을 관리한다.
- 현재 소스에는 fetch/Axios API 서비스, 백엔드 URL·엔드포인트·HTTP 요청/응답 스키마, 토큰 인증, WebSocket/스트리밍이 없다. 따라서 실제 백엔드 연결을 유지·검증했다고 주장할 수 없다.
- 대화는 기존 `mockConversationService.js`의 시나리오 응답이며, 리포트는 `mockCoachingService.js`가 실제 입력 텍스트의 물음표·문자 수 등을 계산한다. 응답 시간·침묵은 기존대로 측정 불가이다.
- 세션은 UUID로 생성하고 완료 상태와 종료 시각을 기록한다. 재연습은 기존 입력 전후 비교, 미션은 기존 자기 기록 방식이다.
- `useSpeech.js`는 브라우저 SpeechRecognition/webkitSpeechRecognition 및 speechSynthesis를 사용한다. 별도 서버 STT/TTS 서비스는 없다.
- 저장 동의와 기록은 `storageService.js`를 통해 `knock-demo-v1` localStorage에 저장한다. 미동의·동의 철회·삭제 동작을 유지했다.
- 대화 준비/듣기/처리/발화/일시정지/오류 상태, 안전 화면, 저장 실패 알림과 비동기 처리 취소를 변경하지 않았다.

## 28개 디자인 매핑

| 번호 | 기존 화면 또는 상태            |
| ---- | ------------------------------ |
| 01   | `/` 시작 안내                  |
| 02   | `/home` 상황 선택              |
| 03   | `/goals` 목표·상황·상대 선택   |
| 04   | `/prepare` 시작 확인·저장 동의 |
| 05   | `/conversation` 첫 대화        |
| 06   | `/report` 리포트               |
| 07   | `/retry` 재연습 입력           |
| 08   | `/missions` overview           |
| 09   | `/records` 기록 목록           |
| 10   | `/safety`                      |
| 11   | 대화 listening                 |
| 12   | 대화 processing                |
| 13   | 대화 hint                      |
| 14   | 대화 paused                    |
| 15   | 대화 error                     |
| 16   | `/retry` 비교 결과             |
| 17   | `/permission` 기존 마이크 안내 |
| 18   | `/confidence/before`           |
| 19   | 대화 후속 턴                   |
| 20   | 기존 대화 종료 모달            |
| 21   | `/confidence/after`            |
| 22   | 미션 choose                    |
| 23   | 미션 record                    |
| 24   | 미션 done                      |
| 25   | `/records/:id` 상세            |
| 26   | `/records/settings`            |
| 27   | 기존 기록 삭제 모달            |
| 28   | `/records` 빈 기록             |

번호는 디자인 화면 식별용이다. 실제 연습 진행률이나 새로운 순차 이동 로직을 도입하지 않았다. 동시 발생 가능한 상태는 기존 조건부 화면을 유지한다.

## 수정 파일

- `src/styles/reference.css`: 기준 색상, 단계 헤더, 카드·버튼·선택 번호, 마이크 패널, 모달, 자신감 평가, 반응형 스타일.
- `src/main.jsx`: 새 스타일시트 연결.
- `src/components/Common.jsx`: 기존 상태를 읽는 디자인 단계 표시와 모달의 선택적 단계 표시. 기존 props·핸들러 보존.
- `src/pages/HomePage.jsx`: 시작 안내 그림을 말풍선 아이콘 패널로 변경.
- `src/pages/ConversationPage.jsx`: 마이크 패널 제목·AI 말풍선 아이콘·종료 모달 단계 표시.
- `src/pages/RecordsPage.jsx`: 삭제 모달 단계 표시.
- `DESIGN_UPDATE.md`: 분석·매핑·검수 문서.

서비스, 데이터 파일, Context, 음성 훅, App 라우트, 환경 변수, 패키지 의존성, 기존 이벤트 처리와 백엔드 코드는 변경하지 않았다. Git add/commit/push를 실행하지 않았다. 기존 미추적 기준 PNG는 수정하지 않았다.

## 검수

- `npm.cmd run build`: 통과. React Router 의존성의 `use client` 지시문 무시 경고가 있으며 빌드는 성공한다.
- `npm.cmd test`: 기존 서비스 테스트 7개 통과.
- `node tests/browser-check.mjs`: 기존 브라우저 검사 10개 통과.
- `node tests/browser-extra.mjs`: 기존 추가 검사 7개 통과.
- `node tests/browser-final.mjs`: 기존 최종 검사 2개 통과.
- 320/375/390/768/1024/1440px의 주요 페이지 및 세션 세부 상태에서 문서 가로 넘침과 화면 밖 컨트롤을 검사했다.
- 대화 시작, 목표·상황·상대 선택, 텍스트 응답, 처리 상태, 힌트, 일시정지·재개, 종료, 리포트, 재연습 비교, 미션, 저장 동의·철회, 기록 유지·삭제, 안전 화면 이동을 검사했다.
- 음성 권한 거부·인식 결과·출력 오류는 브라우저 API 모의 이벤트로 검사했다. 실제 장치 음성 품질과 실제 음성 인식 서비스 연결은 미검증이다.
- PC 사이드바가 있는 홈과 모바일 시작 화면 등 생성된 스크린샷을 확인했다. 결과 이미지와 JSON은 기존 `test-results/` 출력 위치에 있다.
- PowerShell 실행 정책으로 `npm.ps1`이 차단되어 동일 npm의 `npm.cmd`를 사용했다. 실행 정책은 변경하지 않았다.

## 기준 이미지와의 차이 및 검증 한계

- 원본의 28개 모바일 프레임을 28개 라우트로 새로 만들지 않았다. 기존 기능·라우트·조건부 상태에 디자인을 적용했다.
- 기존 문구·설명·텍스트 입력·데모 표시·미측정 지표를 유지하므로 카드 수, 세로 길이, 일부 배치는 원본과 다르다. 모바일에서는 콘텐츠 길이에 따라 스크롤한다.
- 원본의 예시 기록·리포트 수치·분석 결과를 실제 데이터처럼 추가하지 않았다. 재연습에 원래 없던 음성 대화 기능도 추가하지 않았다.
- 실제 백엔드 연동, DB 저장·삭제, 서버 AI/STT/TTS는 이 저장소에 구현되어 있지 않아 검증할 수 없다. 기존 로컬 동작만 보존·검증했다.
- 자동 넘침 검사와 주요 스크린샷 확인을 수행했으나 28개 상태 전부에 대한 픽셀 단위 일치 검증은 수행하지 않았다.
