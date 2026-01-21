import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UI_ROUTES } from "@smm/shared";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import BusinessDashboard from "./pages/BusinessDashboard";
import BrandDashboard from "./pages/BrandDashboard";
import SocialMediaDashboard from "./pages/SocialMediaDashboard";
import PostDashboard from "./pages/PostDashboard";
import InboxDashboard from "./pages/InboxDashboard";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import DataDebug from "./pages/DataDebug";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// Placeholder pages
const Dashboard = () => <div>Dashboard Home</div>;
const Settings = () => <div>Settings</div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path={UI_ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={UI_ROUTES.REGISTER} element={<RegisterPage />} />

        {/* Protected routes */}
        <Route element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route path={UI_ROUTES.HOME} element={<Dashboard />} />
          <Route path={UI_ROUTES.BUSINESSES} element={<BusinessDashboard />} />
          <Route path={UI_ROUTES.BRANDS} element={<BrandDashboard />} />
          <Route path={UI_ROUTES.SOCIAL_MEDIA} element={<SocialMediaDashboard />} />
          <Route path={UI_ROUTES.POSTS} element={<PostDashboard />} />
          <Route path={UI_ROUTES.INBOX} element={<InboxDashboard />} />
          <Route path={UI_ROUTES.ANALYTICS} element={<AnalyticsDashboard />} />
          <Route path={UI_ROUTES.SETTINGS} element={<Settings />} />
          <Route path={UI_ROUTES.DEBUG} element={<DataDebug />} />
        </Route>

        <Route path="*" element={<Navigate to={UI_ROUTES.HOME} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
