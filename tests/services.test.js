import test from "node:test";
import assert from "node:assert/strict";
import {
  buildReport,
  compareUtterances,
} from "../src/services/mockCoachingService.js";
import {
  isSafetyTrigger,
  getConversation,
  getReply,
} from "../src/services/mockConversationService.js";
import {
  readStorage,
  writeStorage,
  STORAGE_KEY,
} from "../src/services/storageService.js";
test("현재 메시지로만 지표를 계산하고 미측정 지표를 null로 둔다", () => {
  const r = buildReport({
    scenarioId: "meeting",
    startedAt: 1000,
    endedAt: 4000,
    messages: [
      { role: "ai", text: "안녕하세요?" },
      { role: "user", text: "안녕 하세요?" },
      { role: "user", text: "저는 처음이에요." },
    ],
  });
  assert.equal(r.userTurns, 2);
  assert.equal(r.questions, 1);
  assert.equal(r.duration, 3);
  assert.equal(r.silence, null);
  assert.equal(r.responseTime, null);
  assert.equal(r.quote, "안녕 하세요?");
  assert.equal(r.averageLength, 7);
  assert.ok(r.recommendation.includes("모임"));
});
test("발화 없는 리포트에 가짜 인용문을 만들지 않는다", () => {
  const r = buildReport({
    scenarioId: "family",
    startedAt: 0,
    endedAt: 1000,
    messages: [],
  });
  assert.equal(r.quote, "");
  assert.equal(r.averageLength, 0);
  assert.equal(r.userTurns, 0);
});
test("세 가지 상황과 페르소나가 각각 다른 대화를 제공한다", () => {
  const ids = ["daily", "meeting", "family"];
  assert.equal(
    new Set(ids.map((id) => getConversation(id).openers.warm)).size,
    3,
  );
  for (const id of ids) {
    assert.equal(getConversation(id).turns.length, 3);
    assert.notEqual(getReply(id, 0, "warm"), getReply(id, 0, "calm"));
    assert.equal(getReply(id, 3, "warm"), null);
  }
});
test("안전 데모는 띄어쓰기 변형을 감지하며 일반 문장은 통과한다", () => {
  assert.equal(isSafetyTrigger("죽 고 싶어요"), true);
  assert.equal(isSafetyTrigger("자해 생각"), true);
  assert.equal(isSafetyTrigger("살고 싶지 않아요"), true);
  assert.equal(isSafetyTrigger("오늘은 카페에 왔어요"), false);
});
test("전후 비교는 실제 두 발화를 유지한다", () => {
  assert.deepEqual(compareUtterances("네.", "네. 어떠세요?"), {
    before: "네.",
    after: "네. 어떠세요?",
    questionsBefore: 0,
    questionsAfter: 1,
    lengthBefore: 2,
    lengthAfter: 8,
  });
});
test("저장 기본값은 미동의이고 손상된 저장소도 안전하다", () => {
  assert.deepEqual(readStorage({ getItem: () => null }), {
    consent: false,
    records: [],
  });
  assert.deepEqual(readStorage({ getItem: () => "{broken" }), {
    consent: false,
    records: [],
  });
  assert.deepEqual(
    readStorage({
      getItem: () => {
        throw Error("denied");
      },
    }),
    { consent: false, records: [] },
  );
});
test("삭제된 기록이 실제 브라우저 저장 데이터에서도 제거된다", () => {
  const data = new Map();
  const storage = {
    getItem: (k) => data.get(k),
    setItem: (k, v) => data.set(k, v),
  };
  const record = {
    id: "one",
    scenarioId: "daily",
    messages: [{ role: "user", text: "안녕하세요" }],
    report: { userTurns: 1 },
  };
  writeStorage(storage, true, [record]);
  assert.equal(readStorage(storage).records.length, 1);
  writeStorage(storage, false, []);
  assert.deepEqual(JSON.parse(data.get(STORAGE_KEY)).records, []);
  assert.equal(readStorage(storage).consent, false);
});
