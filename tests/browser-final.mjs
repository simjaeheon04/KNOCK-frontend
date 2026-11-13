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

async function shot(name) {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/final-" + name + ".png",
    fullPage: true,
  });
}
await check("최종 준비·권한·자신감 화면의 실제 데이터 반응형", async () => {
  await start("daily");
  for (const p of ["/prepare", "/permission", "/confidence/before"]) {
    await route(p);
    for (const w of [320, 375, 390, 768, 1024, 1440])
      await fits(w, p + " " + w);
    await shot(p.split("/").pop());
  }
  await button("이번에는 건너뛰기").click();
  await page.waitForURL("**/conversation");
  await shot("conversation-ready");
  await button("말이 막혔어요").click();
  await shot("hint");
  await button("쉬기").click();
  await shot("paused");
  await button("이어서 연습하기").click();
  await send("따뜻한 라테 주세요. 덜 달게도 가능한가요?");
  await finish();
  await shot("report");
  await button("이 장면 다시 해보기").click();
  await button("재연습 시작하기").click();
  await shot("retry");
  await route("/missions");
  await shot("missions");
  await route("/records/settings");
  await shot("settings");
  await route("/safety");
  await shot("safety");
});
await check("최종 시작·홈 스크린샷 및 주 버튼 하단 접근", async () => {
  await page.goto(url);
  await fits(390, "welcome final");
  await shot("welcome");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const rect = await button("나의 첫 대화 시작하기").boundingBox();
  assert.ok(
    rect.y + rect.height < 830,
    "welcome action clear of mobile navigation after scrolling",
  );
  await page.goto(url + "/home");
  await shot("home");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/final-home-1440.png",
    fullPage: true,
  });
});
assert.deepEqual(errors, []);
await fs.writeFile(
  "test-results/browser-final-results.json",
  JSON.stringify({ results, runtimeErrors: errors }, null, 2),
);
await browser.close();
