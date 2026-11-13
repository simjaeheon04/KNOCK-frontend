import { getConversation } from "./mockConversationService.js";
export function countQuestions(text) {
  return (text.match(/[?？]/g) || []).length;
}
export function buildReport(session) {
  const utterances = session.messages.filter((m) => m.role === "user");
  const total = utterances.reduce(
    (sum, m) => sum + Array.from(m.text.replace(/\s/g, "")).length,
    0,
  );
  return {
    userTurns: utterances.length,
    questions: utterances.reduce((sum, m) => sum + countQuestions(m.text), 0),
    averageLength: utterances.length
      ? Math.round(total / utterances.length)
      : 0,
    silence: null,
    responseTime: null,
    duration: Math.max(
      0,
      Math.round(((session.endedAt || Date.now()) - session.startedAt) / 1000),
    ),
    quote: utterances[0]?.text || "",
    recommendation: getConversation(session.scenarioId).recommendation,
    example: getConversation(session.scenarioId).coaching,
  };
}
export function compareUtterances(before, after) {
  return {
    before,
    after,
    questionsBefore: countQuestions(before),
    questionsAfter: countQuestions(after),
    lengthBefore: Array.from(before).length,
    lengthAfter: Array.from(after).length,
  };
}
