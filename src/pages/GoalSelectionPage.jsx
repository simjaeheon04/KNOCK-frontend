import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Mic, ArrowRight, Check } from "lucide-react";
import {
  Heading,
  Card,
  Choice,
  Button,
  Actions,
  Toggle,
  PrivacyNote,
  icons,
} from "../components/Common";
import { goals } from "../data/goals";
import { scenarios, getScenario } from "../data/scenarios";
import { personas } from "../data/personas";
import { useKnock } from "../context/KnockContext";
import { knockSound } from "../services/mockConversationService";
export default function GoalSelectionPage() {
  const nav = useNavigate();
  const { selection, setSelection } = useKnock();
  const [error, setError] = useState("");
  function select(key, value) {
    setSelection((s) => ({ ...s, [key]: value }));
    setError("");
  }
  function next() {
    if (!selection.goalId || !selection.scenarioId || !selection.personaId) {
      setError("목표, 대화 상황, 대화 상대를 하나씩 골라주세요.");
      return;
    }
    nav("/prepare");
  }
  return (
    <div className="page">
      <Heading
        eyebrow="STEP 01 · 대화 준비"
        description="오늘의 목표는 하나면 충분해요."
      >
        작은 목표부터
        <br />
        골라주세요.
      </Heading>
      <div className="selection-layout">
        <div className="stack">
          <fieldset>
            <legend>오늘의 작은 목표</legend>
            {goals.map((g) => (
              <Choice
                key={g.id}
                title={g.title}
                description={g.description}
                selected={selection.goalId === g.id}
                onClick={() => select("goalId", g.id)}
                name={"goal-" + g.id}
              />
            ))}
          </fieldset>
          <fieldset>
            <legend>어떤 대화를 해볼까요?</legend>
            {scenarios.map((s) => (
              <Choice
                key={s.id}
                title={s.title}
                description={s.category + " · 약 3분 · 편안한 난이도"}
                icon={icons[s.icon]}
                selected={selection.scenarioId === s.id}
                onClick={() => select("scenarioId", s.id)}
                name={"scenario-" + s.id}
              />
            ))}
          </fieldset>
        </div>
        <div className="stack">
          <fieldset>
            <legend>대화 상대</legend>
            <p className="field-note">모두 가상의 AI 역할이에요.</p>
            {personas.map((p) => (
              <Choice
                key={p.id}
                title={
                  p.title +
                  " " +
                  (getScenario(selection.scenarioId)?.shortRole || "상대")
                }
                description={p.description}
                selected={selection.personaId === p.id}
                onClick={() => select("personaId", p.id)}
                name={"persona-" + p.id}
              />
            ))}
          </fieldset>
          <Card tint title="오늘의 연습">
            <p>
              {goals.find((g) => g.id === selection.goalId)?.title ||
                "목표를 골라주세요"}
            </p>
            <p>
              {getScenario(selection.scenarioId)?.title ||
                "대화 상황을 골라주세요"}
            </p>
            <p>
              {personas.find((p) => p.id === selection.personaId)
                ?.description || "대화 상대를 골라주세요"}
            </p>
          </Card>
        </div>
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <Actions>
        <Button onClick={next}>
          이 상황으로 연습하기 <ArrowRight size={17} />
        </Button>
        <Button variant="text" onClick={() => nav("/home")}>
          이전으로 돌아가기
        </Button>
      </Actions>
    </div>
  );
}
export function PreparePage() {
  const nav = useNavigate();
  const { selection, consent, setConsent } = useKnock();
  const scenario = getScenario(selection.scenarioId);
  if (!scenario || !selection.goalId || !selection.personaId)
    return <Navigate to="/goals" replace />;
  return (
    <div className="page narrow">
      <Heading
        eyebrow="STEP 02 · 시작 전 확인"
        description={scenario.role + "과 가벼운 대화를 나눠요."}
      >
        준비되면,
        <br />
        가볍게 똑똑.
      </Heading>
      <div className="stack">
        <Card tint title="오늘의 장면">
          <p>{scenario.scene}</p>
        </Card>
        <Card title="마이크를 사용해요">
          <p>
            브라우저 음성 인식·읽기 기능을 이용하는 데모예요. 실제 AI API는
            연결하지 않아요.
          </p>
          <p>
            음성을 지원하지 않거나 사용을 원치 않으면 텍스트로 연습할 수 있어요.
          </p>
          <PrivacyNote />
        </Card>
        <Card title="대화 기록 저장 · 선택">
          <Toggle
            label="대화 텍스트·지표 저장"
            checked={consent}
            onChange={setConsent}
          />
          <p className="muted">
            동의하면 새로 시작한 연습의 텍스트와 지표를 이 브라우저에 저장해요.
            설정에서 바꾸고 삭제할 수 있어요.
          </p>
        </Card>
      </div>
      <Actions>
        <Button onClick={() => nav("/permission")}>
          똑똑, 연습 준비 <ArrowRight size={17} />
        </Button>
        <Button variant="text" onClick={() => nav("/goals")}>
          상황 다시 고르기
        </Button>
      </Actions>
    </div>
  );
}
export function PermissionPage() {
  const nav = useNavigate();
  const [support] = useState(() =>
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
  );
  const { selection } = useKnock();
  if (!selection.goalId || !selection.scenarioId || !selection.personaId)
    return <Navigate to="/goals" replace />;
  return (
    <div className="page narrow">
      <Heading
        eyebrow="시작 전 · 마이크 권한"
        description="말하는 동안에만 마이크를 사용해요."
      >
        목소리로 대화할
        <br />
        준비를 해볼까요?
      </Heading>
      <div className="permission-icon">
        <Mic size={36} strokeWidth={1.5} />
      </div>
      <div className="stack">
        <Card title="마이크로 무엇을 하나요?">
          <p>
            브라우저가 내 말을 텍스트로 인식해요. 미리 작성된 대화 응답은
            음성으로 읽어줄 수 있어요.
          </p>
        </Card>
        <Card tint title="원본 음성은 보관하지 않아요">
          <p>
            음성 파일을 만들거나 저장하지 않아요. 브라우저 음성 인식 제공사가
            음성을 처리할 수 있어요.
          </p>
          <p className="muted">
            {support
              ? "대화 화면에서 마이크를 누를 때 브라우저 권한 창이 나타날 수 있어요."
              : "이 브라우저는 음성 입력을 지원하지 않아 텍스트로 연습해요."}
          </p>
        </Card>
      </div>
      <Actions>
        <Button onClick={() => nav("/confidence/before")}>
          {support ? "안내 확인 · 다음으로" : "텍스트로 연습할게요"}
        </Button>
        <Button variant="text" onClick={() => nav("/confidence/before")}>
          지금은 텍스트로 시작할게요
        </Button>
      </Actions>
    </div>
  );
}
export function ConfidencePage({ after = false }) {
  const nav = useNavigate();
  const [value, setValue] = useState(null);
  const { session, selection, startSession, updateSession } = useKnock();
  if (after && !session?.completed) return <Navigate to="/goals" replace />;
  if (
    !after &&
    (!selection.goalId || !selection.scenarioId || !selection.personaId)
  )
    return <Navigate to="/goals" replace />;
  function next(skip = false) {
    if (after) {
      updateSession({
        confidenceAfter: skip ? null : value,
        confidenceAfterDone: true,
      });
      nav("/report");
    } else {
      if (startSession(skip ? null : value)) {
        knockSound();
        nav("/conversation");
      }
    }
  }
  return (
    <div className="page narrow">
      <Heading
        eyebrow={after ? "연습 후 · 나의 마음" : "연습 전 · 나의 마음"}
        description={
          after
            ? "처음과 비교해 내 마음을 확인해요."
            : "정답은 없어요. 지금 마음을 골라주세요."
        }
      >
        {after ? (
          <>
            한 번 말해본 지금,
            <br />
            마음은 어떤가요?
          </>
        ) : (
          <>
            지금 대화할 자신감은
            <br />
            어느 정도인가요?
          </>
        )}
      </Heading>
      <Card title="대화할 자신감">
        <div className="rating" role="group" aria-label="자신감 5점 자기평가">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              aria-pressed={value === n}
              className={value === n ? "selected" : ""}
              key={n}
              onClick={() => setValue(n)}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="rating-labels">
          <span>매우 낮아요</span>
          <span>매우 높아요</span>
        </div>
      </Card>
      <Card
        tint
        title={
          after
            ? "연습 전 자신감 " +
              (session.confidenceBefore
                ? session.confidenceBefore + " / 5"
                : "건너뛰었어요")
            : "나만의 속도로 괜찮아요"
        }
      >
        <p>
          {after
            ? "지금 느끼는 마음을 편하게 남겨주세요."
            : "작은 인사 한마디부터 시작해도 괜찮아요."}
        </p>
      </Card>
      <p className="helper">5점 자기평가 · 진단이나 평가 점수가 아니에요.</p>
      <Actions>
        <Button disabled={value === null} onClick={() => next()}>
          {after ? "오늘의 피드백 확인" : "이 마음으로 연습 시작"}
        </Button>
        <Button variant="text" onClick={() => next(true)}>
          이번에는 건너뛰기
        </Button>
      </Actions>
    </div>
  );
}
