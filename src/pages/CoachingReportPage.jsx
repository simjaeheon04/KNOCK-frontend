import { Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  MessageCircle,
  Clock,
  Text,
  HelpCircle,
} from "lucide-react";
import { Heading, Card, Button, Actions, Empty } from "../components/Common";
import { useKnock } from "../context/KnockContext";
import { buildReport } from "../services/mockCoachingService";
import { getScenario } from "../data/scenarios";
export default function CoachingReportPage() {
  const nav = useNavigate();
  const { session } = useKnock();
  if (!session) return <Navigate to="/goals" replace />;
  if (session.blocked) return <Navigate to="/safety" replace />;
  if (!session.completed) return <Navigate to="/conversation" replace />;
  const report = buildReport(session);
  return (
    <div className="page">
      <Heading
        eyebrow="STEP 03 · 오늘의 피드백"
        description={
          getScenario(session.scenarioId).title + " · 데모 세션 리포트"
        }
      >
        {report.userTurns ? (
          <>
            먼저 말을 건넨 것,
            <br />
            좋은 시작이에요.
          </>
        ) : (
          <>
            오늘은 여기까지,
            <br />
            나의 속도로 괜찮아요.
          </>
        )}
      </Heading>
      <Card tint className="report-summary">
        <Sparkles size={25} strokeWidth={1.4} />
        <div>
          <h2>오늘 나눈 대화</h2>
          <p>
            나의 발화 {report.userTurns}회 · 전체 메시지{" "}
            {session.messages.length}개 · {Math.floor(report.duration / 60)}분{" "}
            {report.duration % 60}초
          </p>
        </div>
        <span className="tag">현재 세션 기준</span>
      </Card>
      <div className="metrics">
        <Card>
          <MessageCircle size={20} />
          <strong>
            {report.questions}
            <small>회</small>
          </strong>
          <h2>질문 표시</h2>
          <p>물음표 기준 단순 집계</p>
        </Card>
        <Card>
          <Text size={20} />
          <strong>
            {report.averageLength}
            <small>자</small>
          </strong>
          <h2>평균 응답 길이</h2>
          <p>공백을 제외한 글자 수</p>
        </Card>
        <Card>
          <Clock size={20} />
          <strong className="unavailable">측정 불가</strong>
          <h2>침묵 · 음성 응답 시간</h2>
          <p>음성 시간 정보를 수집하지 않아요</p>
        </Card>
      </div>
      {report.quote ? (
        <div className="report-grid">
          <Card title="내가 건넨 한 문장">
            <span className="tag">실제 입력 발화</span>
            <blockquote>“{report.quote}”</blockquote>
            <p>이번 연습에서 내 말을 한 문장 이상 건넸어요.</p>
          </Card>
          <Card title="한 문장 더 이어 볼까요?" tint>
            <span className="tag">데모 예시</span>
            <blockquote>“{report.recommendation}”</blockquote>
            <p>{report.example}</p>
            <p className="helper">
              사전에 작성된 제안이며, AI가 대화를 분석한 결과는 아니에요.
            </p>
          </Card>
        </div>
      ) : (
        <Empty
          title="비교할 발화가 아직 없어요"
          description="메시지를 입력하지 않아 발화 기반 피드백과 재연습 비교를 만들 수 없어요."
        >
          <Button variant="secondary" onClick={() => nav("/goals")}>
            새 대화 골라보기
          </Button>
        </Empty>
      )}
      <p className="helper">
        질문 수는 물음표 개수로 계산하며 의미상 질문을 모두 인식하지 못해요.
        대화의 질이나 진단 점수가 아니에요.
      </p>
      {session.confidenceBefore !== null || session.confidenceAfter !== null ? (
        <p className="confidence-summary">
          나의 자신감 · 연습 전 {session.confidenceBefore ?? "미응답"} → 연습 후{" "}
          {session.confidenceAfter ?? "미응답"} / 5 <span>사용자 자기평가</span>
        </p>
      ) : null}
      <Actions>
        <Button disabled={!report.quote} onClick={() => nav("/retry")}>
          이 장면 다시 해보기 <ArrowRight size={17} />
        </Button>
        <Button variant="text" onClick={() => nav("/missions")}>
          현실 미션으로 바로 가기 →
        </Button>
      </Actions>
    </div>
  );
}
