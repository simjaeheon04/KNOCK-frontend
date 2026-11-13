import { Routes, Route, Link } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage, { WelcomePage } from "./pages/HomePage";
import GoalSelectionPage, {
  PreparePage,
  PermissionPage,
  ConfidencePage,
} from "./pages/GoalSelectionPage";
import ConversationPage from "./pages/ConversationPage";
import CoachingReportPage from "./pages/CoachingReportPage";
import RetryPage from "./pages/RetryPage";
import MissionPage from "./pages/MissionPage";
import SafetyPage from "./pages/SafetyPage";
import RecordsPage, {
  RecordDetailPage,
  RecordSettingsPage,
} from "./pages/RecordsPage";
import { Heading } from "./components/Common";
export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/goals" element={<GoalSelectionPage />} />
        <Route path="/prepare" element={<PreparePage />} />
        <Route path="/permission" element={<PermissionPage />} />
        <Route
          path="/confidence/before"
          element={<ConfidencePage key="before" />}
        />
        <Route
          path="/confidence/after"
          element={<ConfidencePage key="after" after />}
        />
        <Route path="/conversation" element={<ConversationPage />} />
        <Route path="/report" element={<CoachingReportPage />} />
        <Route path="/retry" element={<RetryPage />} />
        <Route path="/missions" element={<MissionPage />} />
        <Route path="/safety" element={<SafetyPage />} />
        <Route path="/records" element={<RecordsPage />} />
        <Route path="/records/settings" element={<RecordSettingsPage />} />
        <Route path="/records/:id" element={<RecordDetailPage />} />
        <Route
          path="*"
          element={
            <div className="page">
              <Heading
                eyebrow="KNOCK"
                description="주소를 확인하거나 홈으로 돌아가주세요."
              >
                찾으시는 페이지가 없어요.
              </Heading>
              <Link className="button primary" to="/home">
                홈으로 돌아가기
              </Link>
            </div>
          }
        />
      </Routes>
    </Layout>
  );
}
