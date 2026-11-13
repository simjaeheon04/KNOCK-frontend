import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Mic, ArrowRight, RotateCcw } from "lucide-react";
import { Heading, Card, Button, Actions, Empty } from "../components/Common";
import { useKnock } from "../context/KnockContext";
import {
  getConversation,
  isSafetyTrigger,
} from "../services/mockConversationService";
import { compareUtterances } from "../services/mockCoachingService";
import { useSpeech } from "../hooks/useSpeech";
export default function RetryPage() {
  const nav = useNavigate();
  const { session, updateSession } = useKnock();
  const utterances = session?.messages.filter((m) => m.role === "user") || [];
  const [selected, setSelected] = useState(
    session?.retry?.messageId || utterances[0]?.id || "",
  );
  const [text, setText] = useState("");
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);
  const speech = useSpeech({
    onTranscript: (v) => {
      setListening(false);
      if (isSafetyTrigger(v)) {
        block();
        return;
      }
      setText(v);
    },
    onState: (s) => setListening(s === "listening"),
    onError: (message) => {
      setListening(false);
      setError(message);
    },
  });
  if (!session) return <Navigate to="/goals" replace />;
  if (session.blocked) return <Navigate to="/safety" replace />;
  if (!session.completed) return <Navigate to="/conversation" replace />;
  const original = utterances.find((m) => m.id === selected);
  const index = session.messages.findIndex((m) => m.id === selected);
  const counterpart = session.messages[index - 1]?.text;
  const result =
    session.retry && session.retry.messageId === selected
      ? session.retry
      : null;
  const script = getConversation(session.scenarioId);
  function block() {
    speech.stop();
    updateSession({ blocked: true, status: "blocked", saveEligible: false });
    nav("/safety", { replace: true });
  }
  function submit() {
    if (!text.trim()) {
      setError("새롭게 건넬 한 문장을 입력해주세요.");
      return;
    }
    if (isSafetyTrigger(text)) {
      block();
      return;
    }
    speech.stop();
    setListening(false);
    updateSession({
      retry: {
        ...compareUtterances(original.text, text.trim()),
        messageId: selected,
      },
    });
    setActive(false);
    setError("");
  }
  return (
    <div className="page narrow">
      <Heading
        eyebrow={result ? "같은 장면, 새로운 한 문장" : "한 문장 더 · 재연습"}
        description={
          result
            ? "이전과 다시 한 발화를 비교해요."
            : "같은 장면에서 부담 없이 다시 해봐요."
        }
      >
        {result ? (
          <>
            새로운 한 문장을
            <br />
            건네봤어요.
          </>
        ) : (
          <>
            이번엔 질문을
            <br />
            더해볼까요?
          </>
        )}
      </Heading>
      {!original ? (
        <Empty description="이전 발화가 없어 비교할 수 없어요. 새 연습에서 한 문장을 건네보세요.">
          <Button onClick={() => nav("/goals")}>새로운 연습</Button>
        </Empty>
      ) : (
        <>
          <label className="input-label" htmlFor="retry-scene">
            다시 연습할 장면
          </label>
          <select
            id="retry-scene"
            value={selected}
            onChange={(e) => {
              speech.stop();
              setSelected(e.target.value);
              setActive(false);
              setText("");
            }}
          >
            {utterances.map((m, i) => (
              <option key={m.id} value={m.id}>
                {i + 1}. {m.text}
              </option>
            ))}
          </select>
          <div className="stack">
            <Card tint title="상대의 말">
              <p>{counterpart}</p>
            </Card>
            <Card title={result ? "처음에는" : "이전의 나"}>
              <blockquote>“{original.text}”</blockquote>
            </Card>
            {result ? (
              <>
                <Card tint title="다시 해보니">
                  <blockquote>“{result.after}”</blockquote>
                </Card>
                <Card title="두 문장을 나란히 살펴봐요">
                  <p>
                    질문 표시 {result.questionsBefore}개 →{" "}
                    {result.questionsAfter}개
                  </p>
                  <p>
                    발화 길이 {result.lengthBefore}자 → {result.lengthAfter}자
                  </p>
                  <p className="helper">
                    입력한 문장 기준 단순 비교예요. 길이나 질문 수가 대화의 질을
                    뜻하지는 않아요.
                  </p>
                </Card>
              </>
            ) : (
              <Card title="문장 힌트">
                <blockquote>“{script.recommendation}”</blockquote>
                <span className="tag">데모 예시 · 추천 표현</span>
              </Card>
            )}
          </div>
          {active && (
            <div className="retry-input">
              <label htmlFor="retry-input" className="input-label">
                새롭게 건넬 한 문장
              </label>
              <textarea
                id="retry-input"
                rows={3}
                value={text}
                maxLength={1000}
                onChange={(e) => setText(e.target.value)}
                placeholder="나의 말로 다시 이야기해보세요."
              />
              <button
                className="text-link"
                onClick={() => {
                  setError("");
                  speech.listen();
                }}
              >
                <Mic size={17} />
                {listening ? "음성 입력 마치기" : "마이크로 입력하기"}
              </button>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <Button onClick={submit}>다시 연습 마치기</Button>
            </div>
          )}
          <Actions>
            {!active && (
              <Button
                onClick={() => {
                  setActive(true);
                  setText("");
                  setError("");
                }}
              >
                {result ? (
                  <>
                    <RotateCcw size={17} /> 같은 장면 한 번 더 연습하기
                  </>
                ) : (
                  "재연습 시작하기"
                )}
              </Button>
            )}
            {result && (
              <Button variant="secondary" onClick={() => nav("/missions")}>
                현실에서 작은 미션 해보기 <ArrowRight size={17} />
              </Button>
            )}
            <Button variant="text" onClick={() => nav("/report")}>
              피드백으로 돌아가기
            </Button>
          </Actions>
        </>
      )}
    </div>
  );
}
