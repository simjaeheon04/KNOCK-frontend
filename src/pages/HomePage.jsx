import { useNavigate } from "react-router-dom";
import {
  DoorOpen,
  Coffee,
  Users,
  House,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import {
  Heading,
  Card,
  Button,
  Actions,
  Choice,
  PrivacyNote,
} from "../components/Common";
import { useKnock } from "../context/KnockContext";
import { scenarios } from "../data/scenarios";
import "./HomePage.css";
export function WelcomePage() {
  const nav = useNavigate();
  return (
    <div className="page welcome-page">
      <Heading eyebrow="KNOCK · 노크" description="말이 서툴러도 괜찮아요.">
        다시, 대화의 문을
        <br />
        두드려 볼까요?
      </Heading>
      <div className="welcome-grid">
        <div className="door-art" aria-hidden="true">
          <div className="welcome-art-copy">
            <span className="art-knock">knock, knock.</span>
            <span className="art-caption">작은 용기가 새로운 대화로</span>
          </div>
        </div>
        <div className="stack">
          <Card title="나만의 대화 연습">
            <p>AI와 연습하고, 현실에서 한 걸음 더.</p>
            <ol className="process">
              <li>
                <span>01</span>대화 연습
              </li>
              <li>
                <span>02</span>코칭과 재연습
              </li>
              <li>
                <span>03</span>작은 현실 미션
              </li>
            </ol>
          </Card>
          <Card title="안심하고 시작해요">
            <p>
              대화 연습을 돕는 서비스예요.
              <br />
              의료적 진단·치료를 제공하지 않아요.
            </p>
            <PrivacyNote />
            <button
              className="text-link"
              onClick={() => nav("/records/settings")}
            >
              개인정보와 저장 안내 <ArrowRight size={14} />
            </button>
          </Card>
        </div>
      </div>
      <Actions>
        <Button onClick={() => nav("/goals")}>
          나의 첫 대화 시작하기 <ArrowRight size={17} />
        </Button>
        <Button variant="text" onClick={() => nav("/home")}>
          나만의 속도로 한 문장부터
        </Button>
      </Actions>
    </div>
  );
}
export default function HomePage() {
  const nav = useNavigate();
  const { setSelection } = useKnock();
  const iconMap = { coffee: Coffee, users: Users, house: House };
  function choose(id) {
    setSelection({ goalId: "", scenarioId: id, personaId: "" });
    nav("/goals");
  }
  return (
    <div className="page home-page">
      <Heading eyebrow="KNOCK" description="잘하려고 애쓰지 않아도 괜찮아요.">
        오늘은 어떤 대화를
        <br />
        연습해 볼까요?
      </Heading>
      <Card tint className="today-card">
        <div>
          <p className="eyebrow">오늘의 작은 시작</p>
          <h2>
            카페에서 주문하고,
            <br className="desktop-only" /> 한마디 더 건네기
          </h2>
          <button className="text-link" onClick={() => choose("daily")}>
            가볍게 시작해요 <ArrowRight size={16} />
          </button>
        </div>
        <Coffee size={62} strokeWidth={1} aria-hidden="true" />
      </Card>
      <div className="section-label">
        <h2>나에게 맞는 대화</h2>
        <span>작은 목표 하나면 충분해요</span>
      </div>
      <div className="scenario-grid">
        {scenarios.map((s) => (
          <Choice
            key={s.id}
            title={
              (s.id === "family" ? "가족과 안부 나누기" : s.category) + " →"
            }
            description={s.description}
            icon={iconMap[s.icon]}
            onClick={() => choose(s.id)}
          />
        ))}
      </div>
      <p className="gentle-note">하루 한 번, 작은 대화의 문을 열어요.</p>
      <Actions>
        <Button onClick={() => nav("/goals")}>
          대화 연습 고르기 <ArrowRight size={17} />
        </Button>
      </Actions>
      <div className="inline-safety">
        <ShieldCheck size={15} />
        <span>의료적 진단·치료가 아닌 대화 연습 서비스예요.</span>
      </div>
    </div>
  );
}
