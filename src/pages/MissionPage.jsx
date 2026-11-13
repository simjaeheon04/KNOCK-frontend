import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flag, Check, ArrowRight } from "lucide-react";
import { Heading, Card, Button, Actions, Choice } from "../components/Common";
import { missions, missionStatuses } from "../data/missions";
import { useKnock } from "../context/KnockContext";
export default function MissionPage() {
  const nav = useNavigate();
  const { session, updateSession, consent, newPractice } = useKnock();
  const [local, setLocal] = useState({
    id: "family",
    status: "",
    note: "",
    recorded: false,
  });
  const [stage, setStage] = useState("overview");
  const [error, setError] = useState("");
  const value = session?.mission || local;
  const mission = missions.find((m) => m.id === value.id) || missions[0];
  const status = missionStatuses.find((s) => s.id === value.status);
  function update(patch) {
    if (session)
      updateSession((s) => ({ mission: { ...s.mission, ...patch } }));
    else setLocal((v) => ({ ...v, ...patch }));
    setError("");
  }
  function save() {
    if (!value.status) {
      setError("시도 상태를 하나 골라주세요. 보류해도 괜찮아요.");
      return;
    }
    update({ recorded: true });
    setStage("done");
  }
  function fresh() {
    newPractice();
    nav("/goals");
  }
  return (
    <div className="page narrow">
      <Heading
        eyebrow={
          stage === "done"
            ? "미션 기록 완료"
            : stage === "choose"
              ? "현실 미션 · 나에게 맞게"
              : stage === "record"
                ? "현실 미션 · 시도 기록"
                : "STEP 05 · 일상으로 한 걸음"
        }
        description={
          stage === "done"
            ? "완료보다 작은 시도에 의미가 있어요."
            : "완료보다 시도한 마음이 중요해요."
        }
      >
        {stage === "done" ? (
          <>
            오늘의 작은 마음을
            <br />
            기록했어요.
          </>
        ) : stage === "choose" ? (
          <>
            일상에서 해볼
            <br />
            작은 미션을 골라요.
          </>
        ) : stage === "record" ? (
          <>
            작은 시도는
            <br />
            어땠나요?
          </>
        ) : (
          <>
            연습한 한마디를
            <br />
            일상에서도.
          </>
        )}
      </Heading>
      {stage === "choose" ? (
        <>
          <div className="stack">
            {missions.map((m) => (
              <Choice
                key={m.id}
                title={m.title}
                description={m.sentence}
                selected={value.id === m.id}
                onClick={() => update({ id: m.id, recorded: false })}
              />
            ))}
          </div>
          <p className="helper">지금 할 수 있을 만큼만 골라주세요.</p>
          <Actions>
            <Button onClick={() => setStage("overview")}>
              이 미션으로 해볼게요
            </Button>
            <Button
              variant="text"
              onClick={() => {
                update({ status: "deferred" });
                setStage("record");
              }}
            >
              오늘은 보류할게요
            </Button>
          </Actions>
        </>
      ) : stage === "done" ? (
        <>
          <Card tint title={mission.title}>
            <span className="tag">
              <Check size={13} /> {status?.title}
            </span>
            <p>{mission.sentence}</p>
          </Card>
          <Card title="내가 남긴 한 줄">
            <p>{value.note || "소감은 남기지 않았어요."}</p>
          </Card>
          <p className="helper">
            {consent && session?.saveEligible && session.completed
              ? "이 브라우저의 내 기록에 반영했어요."
              : "저장 동의가 적용된 완료 연습이 없어 현재 세션에서만 유지돼요."}{" "}
            실제 수행 여부는 확인하지 않아요.
          </p>
          <Actions>
            <Button onClick={() => nav("/records")}>
              내 기록에서 확인하기
            </Button>
            <Button variant="secondary" onClick={() => setStage("record")}>
              시도 기록 수정하기
            </Button>
            <Button variant="text" onClick={fresh}>
              새로운 대화 연습하기
            </Button>
          </Actions>
        </>
      ) : (
        <>
          <Card tint className="mission-feature">
            <div className="section-label">
              <h2>이번 주의 작은 미션</h2>
              <Flag size={20} />
            </div>
            <span className="tag">{mission.level}</span>
            <h3>{mission.title}</h3>
            <p>{mission.sentence}</p>
            <button className="text-link" onClick={() => setStage("choose")}>
              나에게 맞는 미션 고르기 <ArrowRight size={15} />
            </button>
          </Card>
          {stage === "overview" && (
            <Card title="어떻게 해보면 좋을까요?">
              <p>{mission.description}</p>
            </Card>
          )}
          <fieldset>
            <legend>나의 시도 기록</legend>
            {missionStatuses.map((s) => (
              <Choice
                key={s.id}
                title={s.title}
                description={s.description}
                selected={value.status === s.id}
                onClick={() => update({ status: s.id, recorded: false })}
              />
            ))}
          </fieldset>
          {stage === "record" && (
            <>
              <label className="input-label" htmlFor="mission-note">
                한 줄 소감 · 선택
              </label>
              <textarea
                id="mission-note"
                rows={3}
                maxLength={500}
                value={value.note}
                onChange={(e) =>
                  update({ note: e.target.value, recorded: false })
                }
                placeholder="오늘의 마음을 편하게 남겨주세요."
              />
            </>
          )}
          <p className="helper">
            시도 여부는 직접 남기는 기록이에요. 지금 하지 않아도 괜찮아요.
          </p>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <Actions>
            <Button
              onClick={stage === "overview" ? () => setStage("record") : save}
            >
              {stage === "overview"
                ? "오늘의 마음과 함께 기록하기"
                : "기록하기"}
            </Button>
            <Button variant="text" onClick={fresh}>
              새로운 대화 연습하기
            </Button>
          </Actions>
        </>
      )}
    </div>
  );
}
