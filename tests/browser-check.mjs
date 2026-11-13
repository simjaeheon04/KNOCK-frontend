import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
await page.emulateMedia({ reducedMotion: "reduce" });
const errors = [],
  results = [];
page.on("pageerror", (e) => errors.push(e.message));
const url = "http://127.0.0.1:5173";
await fs.mkdir("test-results", { recursive: true });
async function check(name, fn) {
  await fn();
  results.push(name);
  console.log("PASS " + name);
}
const button = (name) => page.getByRole("button", { name, exact: true });
async function route(path) {
  await page.evaluate((p) => {
    window.history.pushState({}, "", p);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, path);
  await page.waitForTimeout(70);
}
async function start(scenario = "daily", { save = false } = {}) {
  await page.goto(url + "/goals");
  await page.getByTestId("goal-ask").click();
  await page.getByTestId("scenario-" + scenario).click();
  await page.getByTestId("persona-warm").click();
  await button("이 상황으로 연습하기").click();
  if (save) {
    const input = page.getByRole("checkbox");
    if (!(await input.isChecked())) await input.check();
  }
  await button("똑똑, 연습 준비").click();
  await page
    .getByRole("button", { name: /안내 확인 · 다음으로|텍스트로 연습할게요/ })
    .first()
    .click();
  await button("이번에는 건너뛰기").click();
  await page.waitForURL("**/conversation");
}
async function send(text) {
  await page.getByLabel("나의 대화 메시지").fill(text);
  await page
    .getByRole("button", { name: "메시지 보내기", exact: true })
    .click();
  await page.waitForTimeout(800);
}
async function finish() {
  await button("연습 종료").click();
  await button("마치고 피드백 보기").click();
  await page.waitForURL("**/confidence/after");
  await button("이번에는 건너뛰기").click();
  await page.waitForURL("**/report");
}
async function fits(width, label) {
  await page.setViewportSize({ width, height: 900 });
  await page.waitForTimeout(80);
  const overflow = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  assert.ok(
    overflow.document <= width && overflow.body <= width,
    label + " overflow " + JSON.stringify(overflow),
  );
  const out = await page
    .locator("main button, main textarea, main select, .card")
    .evaluateAll((els) =>
      els
        .filter((e) => {
          const r = e.getBoundingClientRect();
          return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1);
        })
        .map((e) => ({
          text: e.textContent.slice(0, 35),
          x: e.getBoundingClientRect().x,
          w: e.getBoundingClientRect().width,
        })),
    );
  assert.deepEqual(out, [], label + " outside viewport");
}
await check("시작 화면과 목표 누락 검증", async () => {
  await page.goto(url);
  await button("나의 첫 대화 시작하기").click();
  await button("이 상황으로 연습하기").click();
  await page
    .getByRole("alert")
    .filter({ hasText: "목표, 대화 상황" })
    .waitFor();
  assert.equal(
    await page.evaluate(() => localStorage.getItem("knock-demo-v1")),
    null,
  );
});
await check("모든 너비에서 시작·홈·목표 화면 넘침 없음", async () => {
  for (const path of [
    "/",
    "/home",
    "/goals",
    "/prepare",
    "/permission",
    "/records",
    "/records/settings",
    "/safety",
  ]) {
    await route(path);
    for (const w of [320, 375, 390, 768, 1024, 1440])
      await fits(w, path + " " + w);
  }
});
await check("첫 만남 상황, 힌트, 일시정지·이어가기, 처리 상태", async () => {
  await start("meeting");
  await page
    .getByText("안녕하세요! 처음 뵙네요. 오늘 어떻게 오셨어요?", {
      exact: true,
    })
    .waitFor();
  await button("말이 막혔어요").click();
  await page
    .getByText("“안녕하세요. 친구 소개로 왔어요.”", { exact: true })
    .waitFor();
  await button("힌트 닫고 대화하기").click();
  await button("쉬기").click();
  await page
    .getByText("마이크 입력과 대화를 멈췄어요.", { exact: false })
    .waitFor();
  await button("이어서 연습하기").click();
  await page
    .getByLabel("나의 대화 메시지")
    .fill("친구 소개로 왔어요. 이런 모임에는 자주 오세요?");
  await page
    .getByRole("button", { name: "메시지 보내기", exact: true })
    .click();
  await page.getByText("••• 답변 준비 중", { exact: true }).waitFor();
  await page.waitForTimeout(800);
  await page
    .getByText("그렇군요! 이런 모임에는 자주 참여하세요?", { exact: true })
    .waitFor();
  for (const w of [320, 375, 390, 768, 1024, 1440])
    await fits(w, "conversation " + w);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.screenshot({
    path: "test-results/conversation-390.png",
    fullPage: true,
  });
});
await check(
  "동의 없는 세션은 종료·리포트 후에도 영구 저장하지 않음",
  async () => {
    await finish();
    await page
      .getByText("“친구 소개로 왔어요. 이런 모임에는 자주 오세요?”", {
        exact: true,
      })
      .waitFor();
    await page.getByText("측정 불가", { exact: true }).waitFor();
    assert.equal(
      await page.evaluate(() => localStorage.getItem("knock-demo-v1")),
      null,
    );
    for (const w of [320, 375, 390, 768, 1024, 1440])
      await fits(w, "report " + w);
    await page.screenshot({
      path: "test-results/report-1440.png",
      fullPage: true,
    });
  },
);
await check("재연습 실제 전후 발화·미션 자가 기록", async () => {
  await button("이 장면 다시 해보기").click();
  await button("재연습 시작하기").click();
  await page
    .getByLabel("새롭게 건넬 한 문장")
    .fill("저는 처음 왔어요. 자주 오시나요?");
  await button("다시 연습 마치기").click();
  await page
    .getByText("“저는 처음 왔어요. 자주 오시나요?”", { exact: true })
    .waitFor();
  for (const w of [320, 375, 390, 768, 1024, 1440]) await fits(w, "retry " + w);
  await button("현실에서 작은 미션 해보기").click();
  await page
    .getByRole("button", { name: "시도했어요 짧은 한마디라도 충분해요." })
    .click();
  await button("오늘의 마음과 함께 기록하기").click();
  await page
    .getByLabel("한 줄 소감 · 선택")
    .fill("조금 긴장했지만 한마디를 건넸어요.");
  await button("기록하기").click();
  await page
    .getByText(
      "저장 동의가 적용된 완료 연습이 없어 현재 세션에서만 유지돼요.",
      { exact: false },
    )
    .waitFor();
  for (const w of [320, 375, 390, 768, 1024, 1440])
    await fits(w, "mission done " + w);
  assert.equal(
    await page.evaluate(() => localStorage.getItem("knock-demo-v1")),
    null,
  );
});
await check("동의한 세션 저장·새로고침 후 유지·상세·실제 삭제", async () => {
  await start("family", { save: true });
  await send("오늘은 산책했어요. 오늘 하루는 어땠어요?");
  await finish();
  await page.waitForTimeout(100);
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("knock-demo-v1")),
  );
  assert.equal(saved.consent, true);
  assert.equal(saved.records.length, 1);
  assert.ok(
    saved.records[0].messages.some((m) => m.text.includes("오늘은 산책했어요")),
  );
  await route("/records");
  await page.reload();
  await page.getByRole("button", { name: /가족과 안부 나누기/ }).click();
  await page
    .getByText("오늘은 산책했어요. 오늘 하루는 어땠어요?", { exact: true })
    .waitFor();
  for (const w of [320, 375, 390, 768, 1024, 1440])
    await fits(w, "record detail " + w);
  await button("이 기록 삭제").click();
  await page.getByRole("dialog").waitFor();
  for (const w of [320, 375, 390, 768, 1024, 1440])
    await fits(w, "delete modal " + w);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "이 기록 삭제하기", exact: true })
    .click();
  await page.waitForURL("**/records");
  assert.deepEqual(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("knock-demo-v1")).records,
    ),
    [],
  );
});
await check(
  "위기 입력 후 대화·재연습 경로 진입 차단 및 위기 입력 미저장",
  async () => {
    await start("daily");
    await page.getByLabel("나의 대화 메시지").fill("죽고 싶어요");
    await page
      .getByRole("button", { name: "메시지 보내기", exact: true })
      .click();
    await page.waitForURL("**/safety");
    await page.getByRole("link", { name: "109", exact: true }).waitFor();
    await route("/conversation");
    await page.waitForURL("**/safety");
    await route("/retry");
    await page.waitForURL("**/safety");
    assert.ok(
      !(await page.evaluate(() =>
        localStorage.getItem("knock-demo-v1").includes("죽고 싶어요"),
      )),
    );
  },
);
await check("새 연습 초기화와 동의 철회 시 진행 세션 미저장", async () => {
  await start("daily");
  await send("따뜻한 라테 주세요.");
  await route("/records/settings");
  await page.getByRole("checkbox").uncheck();
  await page.getByRole("checkbox").check();
  await route("/conversation");
  await finish();
  assert.deepEqual(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("knock-demo-v1")).records,
    ),
    [],
  );
  await route("/missions");
  await button("새로운 대화 연습하기").click();
  assert.equal(
    await page.getByTestId("goal-ask").getAttribute("aria-pressed"),
    "false",
  );
  await route("/conversation");
  await page.waitForURL("**/goals");
});
await check("빈 세션 종료와 재연습 제한", async () => {
  await start("daily");
  await finish();
  assert.equal(await button("이 장면 다시 해보기").isDisabled(), true);
  await page.getByText("비교할 발화가 아직 없어요", { exact: true }).waitFor();
});
await check("스크린샷과 원본 비교 자료", async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url);
  await page.screenshot({
    path: "test-results/welcome-390.png",
    fullPage: true,
  });
  for (const w of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto(url + "/home");
    await page.screenshot({
      path: "test-results/home-" + w + ".png",
      fullPage: true,
    });
  }
  await page.goto(
    url + "/reference/KNOCK_Design_3_Options/KNOCK_A_Sage_28_Screens.svg",
  );
  await page
    .locator('[id="A_Sage-screen-02"]')
    .screenshot({ path: "test-results/reference-home.png" });
});
assert.deepEqual(errors, [], "browser runtime errors");
await fs.writeFile(
  "test-results/browser-results.json",
  JSON.stringify({ results, runtimeErrors: errors }, null, 2),
);
console.log("ALL " + results.length + " BROWSER CHECKS PASSED");
await browser.close();
