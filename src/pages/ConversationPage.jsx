import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Check,
  Wifi,
  MessageCircle,
} from "lucide-react";
import {
  Heading,
  Card,
  Button,
  Modal,
  Actions,
  PrivacyNote,
} from "../components/Common";
import { useKnock } from "../context/KnockContext";
import { useSpeech } from "../hooks/useSpeech";
import { getScenario } from "../data/scenarios";
import { goals } from "../data/goals";
import { personas } from "../data/personas";
import {
  getConversation,
  getReply,
  isSafetyTrigger,
} from "../services/mockConversationService";
export default function ConversationPage() {
  const nav = useNavigate();
  const { session, updateSession, finishSession } = useKnock();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [end, setEnd] = useState(false);
  const [voice, setVoice] = useState(false);
  const timer = useRef(null),
    bottom = useRef(null),
    live = useRef(session);
  live.current = session;
  const speech = useSpeech({
    onTranscript: (text) => send(text),
    onState: (status) => updateSession({ status }),
    onError: (message) => {
      setError(message);
      updateSession({ status: "error" });
    },
  });
  function cancel() {
    clearTimeout(timer.current);
    speech.stop();
  }
  useEffect(
    () => () => {
      cancel();
      const current = live.current;
      if (
        current &&
        !current.completed &&
        !current.blocked &&
        ["processing", "listening", "speaking"].includes(current.status)
      )
        updateSession({
          status: "paused",
          pendingReply: current.status === "processing",
        });
    },
    [],
  );
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [session?.messages.length, session?.status]);
  if (!session) return <Navigate to="/goals" replace />;
  if (session.blocked) return <Navigate to="/safety" replace />;
  if (session.completed)
    return (
      <Navigate
        to={session.confidenceAfterDone ? "/report" : "/confidence/after"}
        replace
      />
    );
  const scenario = getScenario(session.scenarioId),
    script = getConversation(session.scenarioId),
    turn = script.turns[session.turnIndex],
    isBusy =
      ["processing", "speaking", "listening", "paused"].includes(
        session.status,
      ) || end,
    finished = !turn;
  function send(text) {
    const current = live.current;
    const value = text.trim();
    if (
      !value ||
      !current ||
      current.blocked ||
      current.completed ||
      ["processing", "speaking", "paused"].includes(current.status)
    )
      return;
    if (isSafetyTrigger(value)) {
      cancel();
      setInput("");
      updateSession({ blocked: true, status: "blocked", hint: false });
      nav("/safety", { replace: true });
      return;
    }
    if (current.turnIndex >= getConversation(current.scenarioId).turns.length)
      return;
    setError("");
    speech.stop();
    setInput("");
    const reply = getReply(
      current.scenarioId,
      current.turnIndex,
      current.personaId,
    );
    updateSession((s) => ({
      messages: [
        ...s.messages,
        { id: crypto.randomUUID(), role: "user", text: value },
      ],
      status: "processing",
      hint: false,
    }));
    timer.current = setTimeout(() => {
      if (
        live.current?.blocked ||
        live.current?.completed ||
        live.current?.status === "paused"
      )
        return;
      updateSession((s) => ({
        messages: [
          ...s.messages,
          { id: crypto.randomUUID(), role: "ai", text: reply },
        ],
        turnIndex: s.turnIndex + 1,
        status: voice && speech.ttsSupported ? "speaking" : "ready",
      }));
      if (voice && speech.ttsSupported)
        speech.speak(reply, () => updateSession({ status: "ready" }));
    }, 650);
  }
  function pause() {
    cancel();
    updateSession((s) => ({
      status: "paused",
      pendingReply: s.status === "processing",
    }));
  }
  function resume() {
    const s = live.current;
    if (s.pendingReply) {
      const reply = getReply(s.scenarioId, s.turnIndex, s.personaId);
      updateSession((c) => ({
        messages: [
          ...c.messages,
          { id: crypto.randomUUID(), role: "ai", text: reply },
        ],
        turnIndex: c.turnIndex + 1,
        status: "ready",
        pendingReply: false,
      }));
    } else updateSession({ status: "ready" });
  }
  function openEnd() {
    pause();
    setEnd(true);
  }
  function closeEnd() {
    setEnd(false);
    resume();
  }
  function finish() {
    cancel();
    finishSession();
    nav("/confidence/after");
  }
  const titles = {
    ready: finished ? "오늘의 대화를 나눴어요" : "나의 차례예요",
    listening: "잘 듣고 있어요",
    processing: "답변을 준비하고 있어요",
    speaking: "상대의 이야기를 들어요",
    error: "잠시 확인해볼까요?",
    paused: "잠깐 쉬어갈까요?",
  };
  return (
    <div className="page conversation-page">
      <Heading
        eyebrow={
          scenario.title +
          " · " +
          personas.find((p) => p.id === session.personaId)?.title +
          " " +
          scenario.shortRole
        }
        description={
          session.status === "listening"
            ? "서두르지 않아도 괜찮아요."
            : finished
              ? "준비가 되면 오늘의 피드백을 확인해요."
              : "마이크나 텍스트로 편하게 말해보세요."
        }
      >
        {titles[session.status]}
      </Heading>
      <div className="conversation-layout">
        <div className="conversation-main">
          <div className="chat-log" role="log" aria-label="연습 대화">
            {session.messages.map((m) => (
              <div key={m.id} className={"message " + m.role}>
                <strong>
                  {m.role === "ai" && (
                    <MessageCircle
                      className="message-icon"
                      size={25}
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  )}
                  {m.role === "ai" ? "AI · " + scenario.role : "나의 말"}
                </strong>
                <p>{m.text}</p>
              </div>
            ))}
            {session.status === "processing" && (
              <div className="message ai typing">
                <strong>AI · {scenario.role}</strong>
                <p>••• 답변 준비 중</p>
              </div>
            )}
            <div ref={bottom} />
          </div>
          {session.status === "paused" ? (
            <Card tint title="잠시 멈춘 대화">
              <p>
                마이크 입력과 대화를 멈췄어요. 진행 상황은 이 연습 안에서
                유지돼요.
              </p>
            </Card>
          ) : (
            <>
              <div className="voice-zone">
                <span className="mic-panel-title">마이크 입력</span>
                <p role="status" className="voice-status">
                  {session.status === "listening"
                    ? "● 듣는 중"
                    : session.status === "processing"
                      ? "답변 준비 중"
                      : session.status === "speaking"
                        ? "AI 발화 중"
                        : "듣기 대기 중"}
                </p>
                <button
                  className={
                    "mic-button " +
                    (session.status === "listening" ? "listening" : "")
                  }
                  aria-label={
                    session.status === "listening"
                      ? "음성 입력 마치기"
                      : "마이크로 말하기"
                  }
                  disabled={
                    finished ||
                    ["processing", "speaking"].includes(session.status)
                  }
                  onClick={() => {
                    setError("");
                    speech.listen();
                  }}
                >
                  {speech.supported ? <Mic size={30} /> : <MicOff size={30} />}
                </button>
                <small>
                  {speech.supported
                    ? "마이크를 눌러 말하기"
                    : "음성 입력 미지원 · 텍스트로 함께해요"}
                </small>
                <button
                  className="voice-toggle text-link"
                  aria-pressed={voice}
                  onClick={() => {
                    if (voice) {
                      speech.stop();
                      updateSession({ status: "ready" });
                    }
                    setVoice((v) => !v);
                  }}
                >
                  {voice ? <Volume2 size={15} /> : <VolumeX size={15} />}{" "}
                  브라우저 음성 읽기 {voice ? "켜짐" : "꺼짐"}
                </button>
              </div>
              {error && (
                <div className="error" role="alert">
                  <p>{error}</p>
                  <button
                    className="text-link"
                    onClick={() => {
                      setError("");
                      updateSession({ status: "ready" });
                    }}
                  >
                    확인 · 텍스트로 이어가기
                  </button>
                </div>
              )}
              {!finished ? (
                <>
                  <form
                    className="text-input"
                    onSubmit={(e) => {
                      e.preventDefault();
                      send(input);
                    }}
                  >
                    <label htmlFor="message-input" className="sr-only">
                      나의 대화 메시지
                    </label>
                    <textarea
                      id="message-input"
                      placeholder="편하게 한 문장 입력해보세요…"
                      value={input}
                      maxLength={1000}
                      disabled={isBusy}
                      rows={2}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          !e.shiftKey &&
                          !e.nativeEvent.isComposing
                        ) {
                          e.preventDefault();
                          send(input);
                        }
                      }}
                    />
                    <button
                      type="submit"
                      aria-label="메시지 보내기"
                      disabled={!input.trim() || isBusy}
                    >
                      <Send size={19} />
                    </button>
                  </form>
                  <button
                    className="example-response"
                    disabled={isBusy}
                    onClick={() => send(turn.example)}
                  >
                    예시로 말해보기 <span>“{turn.example}”</span>
                  </button>
                </>
              ) : (
                <Button onClick={openEnd} className="full-width">
                  오늘 연습 마치기 <Check size={17} />
                </Button>
              )}
            </>
          )}
        </div>
        <aside className="conversation-aside">
          <Card title="오늘의 작은 목표">
            <p>{goals.find((g) => g.id === session.goalId)?.title}</p>
            <span className="tag">
              작성 시나리오 · {Math.min(session.turnIndex + 1, 3)} / 3 장면
            </span>
          </Card>
          {session.hint && (
            <Card tint title="이렇게 시작해볼까요?">
              <p className="hint-quote">
                “{turn?.hint || script.recommendation}”
              </p>
              <p className="muted">예시를 참고해 내 말로 이야기해요.</p>
              <button
                className="text-link"
                onClick={() => updateSession({ hint: false })}
              >
                힌트 닫기
              </button>
            </Card>
          )}
          <Button
            onClick={() => updateSession({ hint: !session.hint })}
            disabled={session.status === "paused"}
          >
            <Sparkles size={17} />{" "}
            {session.hint ? "힌트 닫고 대화하기" : "말이 막혔어요"}
          </Button>
          <div className="connection-note">
            <Wifi size={14} />
            <span>대화는 로컬 데모 · AI 서버 연결 없음</span>
          </div>
          <p className="helper">
            음성은 브라우저 지원·권한·네트워크에 따라 달라져요. 텍스트 입력은
            언제든 이용할 수 있어요.
          </p>
          <PrivacyNote />
        </aside>
      </div>
      <div className="conversation-toolbar">
        <Button
          variant="secondary"
          onClick={session.status === "paused" ? resume : pause}
          disabled={end}
        >
          {session.status === "paused" ? (
            <Play size={16} />
          ) : (
            <Pause size={16} />
          )}{" "}
          {session.status === "paused" ? "이어서 연습" : "쉬기"}
        </Button>
        <Button variant="secondary" onClick={openEnd}>
          연습 종료
        </Button>
      </div>
      {end && (
        <Modal
          step={20}
          title={
            <>
              여기서 연습을
              <br />
              마칠까요?
            </>
          }
          onClose={closeEnd}
        >
          <p>지금까지 나눈 대화로 피드백을 만들어요.</p>
          <Card tint title="오늘 나눈 대화">
            <p>{scenario.title}</p>
            <p>
              나의 발화{" "}
              {session.messages.filter((m) => m.role === "user").length}회
            </p>
          </Card>
          <Actions>
            <Button onClick={finish}>마치고 피드백 보기</Button>
            <Button variant="secondary" onClick={closeEnd}>
              이어서 연습하기
            </Button>
          </Actions>
        </Modal>
      )}
    </div>
  );
}
