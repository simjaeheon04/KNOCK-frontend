import { useNavigate } from "react-router-dom";
import { Heart, Phone, ArrowUpRight, ShieldCheck } from "lucide-react";
import { Heading, Card, Button, Actions } from "../components/Common";
import { useKnock } from "../context/KnockContext";
export default function SafetyPage() {
  const nav = useNavigate();
  const { session, newPractice } = useKnock();
  return (
    <div className="page narrow safety-page">
      <Heading
        eyebrow="잠시 쉬어가는 시간"
        description={
          session?.blocked
            ? "대화 연습을 멈췄어요. 이 세션의 역할극은 이어지지 않아요."
            : "내 마음을 돌보는 일이 먼저예요."
        }
      >
        지금은 연습보다
        <br />내 마음이 먼저예요.
      </Heading>
      <div className="safety-symbol">
        <Heart size={36} strokeWidth={1.3} />
      </div>
      <Card tint title="혼자 감당하지 않아도 괜찮아요">
        <p>믿을 수 있는 사람이나 전문 상담기관에 도움을 요청할 수 있어요.</p>
      </Card>
      <Card title="도움을 받을 수 있는 곳">
        <p>자살예방상담전화</p>
        <a
          className="hotline"
          href="tel:+82109?oai_link_source=model_response_hotline"
        >
          <Phone size={25} />
          109
        </a>
        <a
          className="text-link"
          href="https://www.129.go.kr/109?oai_link_source=model_response_hotline"
          target="_blank"
          rel="noreferrer"
        >
          전문기관 안내 확인 <ArrowUpRight size={16} />
        </a>
      </Card>
      <Card title="KNOCK의 안내">
        <p>
          특정 표현을 찾는 단순 키워드 감지 데모예요. 실제 안전 판정 기능이
          아니며, 위험을 놓치거나 잘못 감지할 수 있어요.
        </p>
        <p>
          AI는 상황을 정확히 판단하지 못할 수 있어요. 진단이나 치료를 제공하지
          않아요.
        </p>
      </Card>
      <Actions>
        <Button onClick={() => nav("/home")}>
          안내 확인 · 오늘은 쉬어가기
        </Button>
        <Button variant="text" onClick={() => nav("/home")}>
          홈으로 돌아가기
        </Button>
      </Actions>
    </div>
  );
}
