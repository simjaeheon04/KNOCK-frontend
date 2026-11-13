import { conversations } from "../data/conversations.js";
export const SAFETY_DEMO_PHRASES = [
  "죽고 싶",
  "죽고싶",
  "자살",
  "자해",
  "목숨을 끊",
  "살고 싶지 않",
  "살고싶지않",
];
export function isSafetyTrigger(text) {
  const normalized = text.normalize("NFKC").toLowerCase().replace(/\s+/g, "");
  return SAFETY_DEMO_PHRASES.some((p) =>
    normalized.includes(p.replace(/\s+/g, "")),
  );
}
export function getConversation(scenarioId) {
  return conversations[scenarioId] || conversations.daily;
}
export function getReply(scenarioId, index, personaId) {
  const turn = getConversation(scenarioId).turns[index];
  if (!turn) return null;
  const prefixes = {
    warm: "",
    calm: "천천히 이야기해도 괜찮아요. ",
    bright: "이야기해주셔서 반가워요! ",
  };
  return (prefixes[personaId] || "") + turn.reply;
}
export function knockSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    [0, 0.18].forEach((delay) => {
      const osc = ctx.createOscillator(),
        gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(190, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0.13, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + delay + 0.1,
      );
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.12);
    });
    setTimeout(() => ctx.close(), 700);
  } catch {
    /* 효과음 미지원 시에도 연습 가능 */
  }
}
