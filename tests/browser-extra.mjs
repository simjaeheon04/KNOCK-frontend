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

await check("완성된 카페 시나리오 3장면과 최종 리포트", async () => {
  await start("daily", { save: true });
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: /예시로 말해보기/ }).click();
    await page.waitForTimeout(750);
  }
  await page.getByRole("heading", { name: "오늘의 대화를 나눴어요" }).waitFor();
  await button("오늘 연습 마치기").click();
  await button("마치고 피드백 보기").click();
  await page.waitForURL("**/confidence/after");
  await button("4").click();
  await button("오늘의 피드백 확인").click();
  await page.waitForURL("**/report");
  await page.getByText("나의 발화 3회", { exact: false }).waitFor();
  await page
    .getByText("나의 자신감 · 연습 전 미응답 → 연습 후 4 / 5", { exact: false })
    .waitFor();
});
await check(
  "생존 세션의 기록 삭제가 자동 재저장을 일으키지 않음·모달 포커스",
  async () => {
    await route("/records");
    await page.getByRole("button", { name: /카페에서 주문하기/ }).click();
    await button("이 기록 삭제").click();
    const dialog = page.getByRole("dialog");
    assert.equal(
      await dialog.evaluate((e) => e.contains(document.activeElement)),
      true,
    );
    await page.keyboard.press("Shift+Tab");
    assert.equal(
      await dialog.evaluate((e) => e.contains(document.activeElement)),
      true,
    );
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    assert.equal(
      await button("이 기록 삭제").evaluate(
        (e) => document.activeElement === e,
      ),
      true,
    );
    await button("이 기록 삭제").click();
    await dialog
      .getByRole("button", { name: "이 기록 삭제하기", exact: true })
      .click();
    await route("/report");
    await page.waitForTimeout(200);
    assert.deepEqual(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("knock-demo-v1")).records,
      ),
      [],
    );
  },
);
await check("처리 중 화면 이탈 후 재진입하면 응답을 복구함", async () => {
  await start("family");
  await page.getByLabel("나의 대화 메시지").fill("오늘 하루는 어땠어요?");
  await page
    .getByRole("button", { name: "메시지 보내기", exact: true })
    .click();
  await route("/records");
  await route("/conversation");
  await page.getByRole("heading", { name: "잠깐 쉬어갈까요?" }).waitFor();
  await button("이어서 연습하기").click();
  await page
    .getByText("바쁜 하루였구나. 어떤 일이 가장 기억에 남아?", { exact: true })
    .waitFor();
});
await check("재연습 위기 입력과 삭제 전체 기능", async () => {
  await finish();
  await button("이 장면 다시 해보기").click();
  await button("재연습 시작하기").click();
  await page.getByLabel("새롭게 건넬 한 문장").fill("자해 생각");
  await button("다시 연습 마치기").click();
  await page.waitForURL("**/safety");
  await route("/records/settings");
  await button("저장한 모든 기록 삭제").click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "모든 기록 삭제하기", exact: true })
    .click();
  assert.deepEqual(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("knock-demo-v1")).records,
    ),
    [],
  );
});
await check("음성 미지원 대체 입력", async () => {
  await context.addInitScript(() => {
    Object.defineProperty(window, "SpeechRecognition", {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(window, "webkitSpeechRecognition", {
      value: undefined,
      configurable: true,
    });
  });
  await start("daily");
  await page
    .getByRole("button", { name: "마이크로 말하기", exact: true })
    .click();
  await page
    .getByRole("alert")
    .filter({ hasText: "이 브라우저는 음성 입력을 지원하지 않아요." })
    .waitFor();
  await button("확인 · 텍스트로 이어가기").click();
  await send("라테 주세요.");
  await page
    .getByText("네, 따뜻한 라테 한 잔이요. 단맛은 어느 정도로 해드릴까요?", {
      exact: true,
    })
    .waitFor();
});
await check(
  "브라우저 음성 상태·권한 거부·인식 결과·출력 오류 mock",
  async () => {
    await context.addInitScript(() => {
      class Recognition {
        constructor() {
          window.__recognition = this;
        }
        start() {}
        abort() {}
        stop() {
          this.onend?.();
        }
      }
      Object.defineProperty(window, "SpeechRecognition", {
        value: Recognition,
        configurable: true,
      });
      Object.defineProperty(window, "webkitSpeechRecognition", {
        value: Recognition,
        configurable: true,
      });
      window.speechSynthesis.speak = (u) => {
        window.__utterance = u;
      };
      window.speechSynthesis.cancel = () => {};
    });
    await start("meeting");
    await page
      .getByRole("button", { name: "마이크로 말하기", exact: true })
      .click();
    await page.getByRole("heading", { name: "잘 듣고 있어요" }).waitFor();
    await page.evaluate(() =>
      window.__recognition.onerror({ error: "not-allowed" }),
    );
    await page
      .getByRole("alert")
      .filter({ hasText: "마이크 권한이 허용되지 않았어요." })
      .waitFor();
    await button("확인 · 텍스트로 이어가기").click();
    await page
      .getByRole("button", { name: "브라우저 음성 읽기 꺼짐", exact: true })
      .click();
    await page
      .getByRole("button", { name: "마이크로 말하기", exact: true })
      .click();
    await page.evaluate(() =>
      window.__recognition.onresult({
        results: [[{ transcript: "친구 소개로 왔어요." }]],
      }),
    );
    await page.waitForTimeout(750);
    await page
      .getByRole("heading", { name: "상대의 이야기를 들어요" })
      .waitFor();
    await page.evaluate(() =>
      window.__utterance.onerror({ error: "synthesis-failed" }),
    );
    await page
      .getByRole("alert")
      .filter({ hasText: "음성 출력을 마치지 못했어요." })
      .waitFor();
    await button("확인 · 텍스트로 이어가기").click();
  },
);
await check("세션 상태가 있는 모든 세부 화면의 6개 너비", async () => {
  await finish();
  await route("/retry");
  await button("재연습 시작하기").click();
  for (const w of [320, 375, 390, 768, 1024, 1440])
    await fits(w, "retry input " + w);
  await route("/missions");
  await page.getByRole("button", { name: /나에게 맞는 미션 고르기/ }).click();
  for (const w of [320, 375, 390, 768, 1024, 1440])
    await fits(w, "mission choose " + w);
  await button("이 미션으로 해볼게요").click();
  await button("오늘의 마음과 함께 기록하기").click();
  for (const w of [320, 375, 390, 768, 1024, 1440])
    await fits(w, "mission record " + w);
  await start("daily");
  await button("말이 막혔어요").click();
  for (const w of [320, 375, 390, 768, 1024, 1440]) await fits(w, "hint " + w);
  await button("쉬기").click();
  for (const w of [320, 375, 390, 768, 1024, 1440])
    await fits(w, "paused " + w);
  await button("이어서 연습하기").click();
  await button("연습 종료").click();
  for (const w of [320, 375, 390, 768, 1024, 1440])
    await fits(w, "end dialog " + w);
  await page.keyboard.press("Escape");
});
assert.deepEqual(errors, []);
await fs.writeFile(
  "test-results/browser-extra-results.json",
  JSON.stringify({ results, runtimeErrors: errors }, null, 2),
);
console.log("ALL " + results.length + " EXTRA CHECKS PASSED");
await browser.close();
