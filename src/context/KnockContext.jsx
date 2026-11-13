import { createContext, useContext, useEffect, useRef, useState } from "react";
import { readStorage, writeStorage } from "../services/storageService";
import { buildReport } from "../services/mockCoachingService";
import { getConversation } from "../services/mockConversationService";
import { getScenario } from "../data/scenarios";
const Context = createContext(null);
export function KnockProvider({ children }) {
  const [initial] = useState(() => {
    try {
      return readStorage(window.localStorage);
    } catch {
      return { consent: false, records: [] };
    }
  });
  const [consent, setConsentValue] = useState(initial.consent);
  const [records, setRecords] = useState(initial.records);
  const [storageError, setStorageError] = useState("");
  const [session, setSession] = useState(null);
  const [selection, setSelection] = useState({
    goalId: "",
    scenarioId: "",
    personaId: "",
  });
  const [notice, setNotice] = useState("");
  const hydrated = useRef(false);
  function persist(nextConsent, nextRecords) {
    try {
      writeStorage(window.localStorage, nextConsent, nextRecords);
      setStorageError("");
      return true;
    } catch {
      setStorageError(
        "브라우저 저장소를 사용할 수 없어요. 이번 기록은 현재 화면에서만 유지돼요.",
      );
      return false;
    }
  }
  function setConsent(value) {
    setConsentValue(value);
    persist(value, records);
    setNotice(
      value
        ? "저장을 켰어요. 지금부터 새로 시작하는 연습에 적용돼요."
        : "저장을 껐어요. 기존 기록은 남아 있으며 아래에서 삭제할 수 있어요.",
    );
    if (!value) setSession((s) => (s ? { ...s, saveEligible: false } : s));
  }
  function updateSession(patch) {
    setSession((s) =>
      s ? { ...s, ...(typeof patch === "function" ? patch(s) : patch) } : s,
    );
  }
  function startSession(confidence = null) {
    const scenario = getScenario(selection.scenarioId);
    if (!scenario || !selection.goalId || !selection.personaId) return false;
    setSession({
      id: crypto.randomUUID(),
      ...selection,
      startedAt: Date.now(),
      messages: [
        {
          id: crypto.randomUUID(),
          role: "ai",
          text: getConversation(scenario.id).openers[selection.personaId],
        },
      ],
      status: "ready",
      turnIndex: 0,
      completed: false,
      blocked: false,
      hint: false,
      saveEligible: consent,
      confidenceBefore: confidence,
      confidenceAfter: null,
      retry: null,
      mission: { id: scenario.mission, status: "", note: "", recorded: false },
    });
    return true;
  }
  function finishSession() {
    setSession((s) =>
      s ? { ...s, status: "ready", completed: true, endedAt: Date.now() } : s,
    );
  }
  function newPractice() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSession(null);
    setSelection({ goalId: "", scenarioId: "", personaId: "" });
  }
  function deleteRecords(id) {
    const next = id ? records.filter((r) => r.id !== id) : [];
    if (!persist(consent, next)) return false;
    setRecords(next);
    if (session && (!id || session.id === id))
      setSession((s) => ({ ...s, saveEligible: false }));
    setNotice(
      id ? "선택한 기록을 삭제했어요." : "저장한 모든 기록을 삭제했어요.",
    );
    return true;
  }
  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
    }
    if (
      !session?.completed ||
      session.blocked ||
      !session.saveEligible ||
      !consent
    )
      return;
    const report = buildReport(session);
    const record = { ...session, report, savedAt: Date.now() };
    setRecords((prev) => {
      const next = [record, ...prev.filter((r) => r.id !== session.id)];
      persist(consent, next);
      return next;
    });
  }, [session, consent]);
  const value = {
    selection,
    setSelection,
    session,
    updateSession,
    startSession,
    finishSession,
    newPractice,
    consent,
    setConsent,
    records,
    deleteRecords,
    notice,
    setNotice,
    storageError,
    dismissNotification: () => {
      setNotice("");
      setStorageError("");
    },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useKnock() {
  return useContext(Context);
}
