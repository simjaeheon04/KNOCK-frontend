export const STORAGE_KEY = "knock-demo-v1";
export function readStorage(storage) {
  try {
    const raw = JSON.parse(storage.getItem(STORAGE_KEY) || "null");
    if (!raw || raw.version !== 1) return { consent: false, records: [] };
    return {
      consent: raw.consent === true,
      records: Array.isArray(raw.records)
        ? raw.records.filter(
            (r) =>
              r &&
              typeof r.id === "string" &&
              Array.isArray(r.messages) &&
              r.messages.every((m) => m && typeof m.text === "string") &&
              ["daily", "meeting", "family"].includes(r.scenarioId) &&
              r.report &&
              typeof r.report.userTurns === "number",
          )
        : [],
    };
  } catch {
    return { consent: false, records: [] };
  }
}
export function writeStorage(storage, consent, records) {
  storage.setItem(
    STORAGE_KEY,
    JSON.stringify({ version: 1, consent, records }),
  );
}
