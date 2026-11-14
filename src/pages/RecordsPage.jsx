import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  NotebookPen,
  Trash2,
  Check,
  ShieldCheck,
} from "lucide-react";
import {
  Heading,
  Card,
  Button,
  Actions,
  Empty,
  Modal,
  Toggle,
  PrivacyNote,
} from "../components/Common";
import { useKnock } from "../context/KnockContext";
import { getScenario } from "../data/scenarios";
import { missions, missionStatuses } from "../data/missions";
function DeleteModal({ id, onClose, onDeleted }) {
  const { deleteRecords, records } = useKnock();
  const record = records.find((r) => r.id === id);
  return (
    <Modal
      step={27}
      title={
        id ? (
          <>
            이 기록을
            <br />
            삭제할까요?
          </>
        ) : (
          <>
            저장한 모든 기록을
            <br />
            삭제할까요?
          </>
        )
      }
      onClose={onClose}
    >
      <p>삭제한 기록은 다시 되돌릴 수 없어요.</p>
      <Card tint title={id ? "선택한 기록" : "모든 저장 기록"}>
        <p>
          {id
            ? getScenario(record?.scenarioId)?.title
            : records.length + "개의 연습 기록"}
        </p>
      </Card>
      <Card title="함께 삭제되는 항목">
        <p>
          해당 대화 텍스트 · 코칭 결과 · 발화 지표 · 재연습 · 연결된 미션 기록
        </p>
        <p className="helper">
          {id
            ? "다른 연습 기록은 유지돼요."
            : "이 브라우저에 저장한 연습 기록을 모두 지워요."}
        </p>
      </Card>
      <Actions>
        <Button
          variant="danger"
          onClick={() => {
            if (deleteRecords(id)) {
              onDeleted?.();
              onClose();
            }
          }}
        >
          {id ? "이 기록 삭제하기" : "모든 기록 삭제하기"}
        </Button>
        <Button variant="secondary" onClick={onClose}>
          취소하고 돌아가기
        </Button>
      </Actions>
    </Modal>
  );
}
export default function RecordsPage() {
  const nav = useNavigate();
  const { records, consent, newPractice } = useKnock();
  const [deleting, setDeleting] = useState(false);
  function fresh() {
    newPractice();
    nav("/goals");
  }
  return (
    <div className="page">
      <Heading
        eyebrow="MY KNOCK"
        description="이 브라우저에 저장된, 동의한 연습만 보여드려요."
      >
        조금씩 쌓이는
        <br />
        나의 대화.
      </Heading>
      <div className="record-stats">
        <Card tint>
          <p>저장한 연습</p>
          <strong>
            {records.length}
            <small>회</small>
          </strong>
        </Card>
        <Card tint>
          <p>현실 미션 시도</p>
          <strong>
            {
              records.filter(
                (r) => r.mission?.recorded && r.mission.status === "tried",
              ).length
            }
            <small>회</small>
          </strong>
        </Card>
      </div>
      <div className="section-label">
        <h2>최근 연습</h2>
        <span>{records.length}개의 기록</span>
      </div>
      {records.length ? (
        <div className="stack">
          {records.map((r) => (
            <button
              key={r.id}
              className="record-row"
              onClick={() => nav("/records/" + r.id)}
            >
              <span className="record-icon">
                <NotebookPen size={20} />
              </span>
              <span>
                <strong>{getScenario(r.scenarioId)?.title}</strong>
                <small>
                  {new Date(r.startedAt).toLocaleDateString("ko-KR")} · 나의
                  발화 {r.report.userTurns}회{r.retry ? " · 재연습 완료" : ""}
                </small>
              </span>
              <ArrowRight size={18} />
            </button>
          ))}
        </div>
      ) : (
        <Empty
          title="새로운 대화가 쌓일 자리예요"
          description="아직 저장된 연습이 없어요. 기록 저장에 동의하고 새 연습을 마치면 나의 대화를 다시 볼 수 있어요."
        />
      )}
      <div className="record-settings">
        <button className="record-row" onClick={() => nav("/records/settings")}>
          <ShieldCheck size={21} />
          <span>
            <strong>기록과 개인정보</strong>
            <small>대화 텍스트·지표 저장 {consent ? "켜짐" : "꺼짐"}</small>
          </span>
          <ArrowRight size={18} />
        </button>
        <button
          className="record-row"
          disabled={!records.length}
          onClick={() => setDeleting(true)}
        >
          <Trash2 size={20} />
          <span>
            <strong>저장한 모든 기록 삭제</strong>
            <small>삭제 전 다시 한 번 확인해요.</small>
          </span>
          <ArrowRight size={18} />
        </button>
      </div>
      <PrivacyNote />
      <Actions>
        <Button onClick={fresh}>
          새로운 대화 연습하기 <ArrowRight size={17} />
        </Button>
      </Actions>
      {deleting && <DeleteModal onClose={() => setDeleting(false)} />}
    </div>
  );
}
export function RecordDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { records, newPractice, setSelection } = useKnock();
  const [deleting, setDeleting] = useState(false);
  const r = records.find((r) => r.id === id);
  if (!r)
    return (
      <div className="page narrow">
        <Heading
          eyebrow="내 기록"
          description="삭제되었거나 이 브라우저에 없는 기록이에요."
        >
          기록을 찾을 수 없어요.
        </Heading>
        <Button onClick={() => nav("/records")}>내 기록으로 돌아가기</Button>
      </div>
    );
  return (
    <div className="page narrow">
      <Heading
        eyebrow="내 기록 · 연습 상세"
        description={
          getScenario(r.scenarioId)?.title +
          " · " +
          new Date(r.startedAt).toLocaleDateString("ko-KR")
        }
      >
        오늘의 대화를
        <br />
        돌아봐요.
      </Heading>
      <Card tint title="나의 작은 기록">
        <p>
          질문 표시 {r.report.questions}회 · 평균 응답 {r.report.averageLength}
          자
        </p>
        <p>
          자신감 {r.confidenceBefore ?? "미응답"} →{" "}
          {r.confidenceAfter ?? "미응답"} / 5
        </p>
      </Card>
      {r.retry && (
        <Card title="다시 건넨 한 문장">
          <p>이전: “{r.retry.before}”</p>
          <blockquote>“{r.retry.after}”</blockquote>
        </Card>
      )}
      <Card title="오늘 나눈 대화">
        <div className="record-transcript">
          {r.messages.map((m, i) => (
            <div key={i}>
              <strong>{m.role === "user" ? "나" : "AI 상대"}</strong>
              <p>{m.text}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card title="이어진 현실 미션">
        <p>{missions.find((m) => m.id === r.mission?.id)?.title}</p>
        <p>
          {r.mission?.recorded
            ? missionStatuses.find((s) => s.id === r.mission.status)?.title
            : "아직 기록하지 않았어요"}
        </p>
        {r.mission?.recorded && r.mission.note && (
          <blockquote>“{r.mission.note}”</blockquote>
        )}
      </Card>
      <p className="helper">
        지표는 입력 발화 기준 단순 집계이며 진단·치료가 아니에요.
      </p>
      <Actions>
        <Button
          onClick={() => {
            newPractice();
            setSelection({
              goalId: r.goalId,
              scenarioId: r.scenarioId,
              personaId: r.personaId,
            });
            nav("/prepare");
          }}
        >
          같은 상황 다시 연습하기
        </Button>
        <Button variant="secondary" onClick={() => setDeleting(true)}>
          <Trash2 size={17} /> 이 기록 삭제
        </Button>
        <Button variant="text" onClick={() => nav("/records")}>
          목록으로 돌아가기
        </Button>
      </Actions>
      {deleting && (
        <DeleteModal
          id={r.id}
          onClose={() => setDeleting(false)}
          onDeleted={() => nav("/records", { replace: true })}
        />
      )}
    </div>
  );
}
export function RecordSettingsPage() {
  const nav = useNavigate();
  const { consent, setConsent, records, setNotice } = useKnock();
  const [deleting, setDeleting] = useState(false);
  return (
    <div className="page narrow">
      <Heading
        eyebrow="설정 · 기록과 개인정보"
        description="저장하지 않고도 지금 대화는 연습할 수 있어요."
      >
        내 기록은
        <br />
        내가 선택해요.
      </Heading>
      <Card>
        <Toggle
          label="대화 텍스트·지표 저장"
          checked={consent}
          onChange={setConsent}
        />
        <p>
          동의한 뒤 새로 시작하는 연습만 기록으로 남겨요. 진행 중 동의를 켜도
          이전 대화를 소급해 저장하지 않아요.
        </p>
        <PrivacyNote />
      </Card>
      <Card tint title="내 브라우저에 저장해요">
        <p>
          이 프로토타입은 서버 대신 브라우저 localStorage를 사용해요. 다른
          기기와 공유되지 않으며 브라우저 데이터를 지우면 기록도 없어져요.
        </p>
        <p>
          음성 파일은 만들거나 보관하지 않아요. 음성 인식은 브라우저 제공사가
          처리할 수 있어요.
        </p>
      </Card>
      <Card title="저장 끄기와 삭제는 달라요">
        <p>
          저장을 꺼도 기존 기록 {records.length}개는 남아 있어요. 아래에서
          별도로 삭제할 수 있어요.
        </p>
        <p>
          진행 중인 세션에서 동의를 철회하면 그 세션은 다시 동의해도 저장하지
          않아요.
        </p>
      </Card>
      <Button
        className="record-delete-action"
        variant="secondary"
        disabled={!records.length}
        onClick={() => setDeleting(true)}
      >
        <Trash2 size={17} /> 저장한 모든 기록 삭제
      </Button>
      <p className="helper">
        이 데모에는 서버 보관 정책이 없어요. 실제 서비스의 보관 기간과 서버 삭제
        정책은 별도 확정이 필요해요.
      </p>
      <Actions>
        <Button
          onClick={() => {
            setNotice("현재 동의 설정을 이 브라우저에 반영했어요.");
            nav("/records");
          }}
        >
          설정 확인
        </Button>
        <Button variant="text" onClick={() => nav("/records")}>
          내 기록으로 돌아가기
        </Button>
      </Actions>
      {deleting && <DeleteModal onClose={() => setDeleting(false)} />}
    </div>
  );
}
