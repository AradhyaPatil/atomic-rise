import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";

// Code splitting with React.lazy — each page is a separate chunk
const Home = lazy(() => import("./pages/Home"));
const AddHabit = lazy(() => import("./pages/AddHabit"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Rewards = lazy(() => import("./pages/Rewards"));
const Challenges = lazy(() => import("./pages/Challenges"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const FocusMode = lazy(() => import("./pages/FocusMode"));
const CheckIn = lazy(() => import("./pages/CheckIn"));
const Profile = lazy(() => import("./pages/Profile"));
const AIPlanner = lazy(() => import("./pages/AIPlanner"));
const Vault = lazy(() => import("./pages/Vault"));
const HabitPlanView = lazy(() => import("./pages/HabitPlanView"));

function PageLoader() {
  return (
    <div className="page-loader">
      <div className="page-loader-spinner" />
      <p>Loading...</p>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="app-layout">
          <Header />
          <main className="app-content">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/add-habit" element={<AddHabit />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/rewards" element={<Rewards />} />
                <Route path="/challenges" element={<Challenges />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/focus" element={<FocusMode />} />
                <Route path="/checkin" element={<CheckIn />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/ai-planner" element={<AIPlanner />} />
                <Route path="/vault" element={<Vault />} />
                <Route path="/habit/:id/plan" element={<HabitPlanView />} />
              </Routes>
            </Suspense>
          </main>
          <BottomNav />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
