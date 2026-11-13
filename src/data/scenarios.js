export const scenarios = [
  {
    id: "daily",
    title: "카페에서 주문하기",
    category: "일상 대화",
    description: "주문하기 · 이웃에게 인사하기",
    role: "카페 직원",
    shortRole: "직원",
    scene: "처음 방문한 카페. 메뉴를 고르고 추천 음료를 물어보세요.",
    mission: "thanks",
    icon: "coffee",
  },
  {
    id: "meeting",
    title: "첫 만남에서 인사하기",
    category: "첫 만남",
    description: "자기소개 · 공통 관심사 찾기",
    role: "모임에서 만난 친구",
    shortRole: "친구",
    scene:
      "친구의 소개로 온 작은 모임. 처음 만난 사람과 가볍게 인사를 나눠보세요.",
    mission: "message",
    icon: "users",
  },
  {
    id: "family",
    title: "가족과 안부 나누기",
    category: "가족 대화",
    description: "부담 없는 한 문장부터",
    role: "가족",
    shortRole: "가족",
    scene: "저녁을 먹고 쉬는 시간. 가족에게 오늘 하루가 어땠는지 물어보세요.",
    mission: "family",
    icon: "house",
  },
];
export const getScenario = (id) => scenarios.find((s) => s.id === id);
