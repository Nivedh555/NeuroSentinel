import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SurveyBanner from './components/SurveyBanner';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthLayout from './components/layout/AuthLayout';
import BotDashboard from './pages/BotDashboard';
import About from './pages/About';
import ChatPage from './components/chatbot/ChatPage';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import VerifyAccount from './components/auth/VerifyAccount';
import Insights from './pages/Insights';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import UserOnlyRoute from './components/auth/UserOnlyRoute';
import Home from './pages/Home';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Settings from './pages/Settings';
import Journal from './pages/Journal';
import AnxietyQuiz from './components/quiz/AnxietyQuiz';
import DepressionQuiz from './components/quiz/DepressionQuiz';
import SleepQuiz from './components/quiz/SleepQuiz';
import StressQuiz from './components/quiz/StressQuiz';
import DailyQuiz from './components/quiz/DailyQuiz';
import Helplines from './pages/Helplines';
import DiagnosisPage from './pages/DiagnosisPage';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorLogin from './pages/DoctorLogin';
import NotFound from './pages/NotFound';
import RateLimited from './pages/RateLimited';
import Survey from './pages/Survey';
import NavigationSetter from './components/NavigationSetter';

function App() {
  console.log("[App] Rendering. Time:", new Date().toLocaleTimeString());


  return (
    <Router>
      <NavigationSetter />
      <Routes>

        <Route element={<UserOnlyRoute><AuthLayout><Login /></AuthLayout></UserOnlyRoute>} path="/login" />
        <Route element={<UserOnlyRoute><AuthLayout><Signup /></AuthLayout></UserOnlyRoute>} path="/signup" />
        <Route element={<UserOnlyRoute><AuthLayout><ForgotPassword /></AuthLayout></UserOnlyRoute>} path="/forgot-password" />
        <Route element={<UserOnlyRoute><AuthLayout><ResetPassword /></AuthLayout></UserOnlyRoute>} path="/reset-password" />
        <Route path="/survey" element={<UserOnlyRoute><ProtectedRoute><Survey /></ProtectedRoute></UserOnlyRoute>} />
        <Route path="/rate-limited" element={<RateLimited />} />
        <Route path="/doctor-login" element={<AdminRoute allowWithoutAdminSession={true}><DoctorLogin /></AdminRoute>} />
        <Route path="/doctor-dashboard" element={<AdminRoute><DoctorDashboard /></AdminRoute>} />

        <Route
          element={
            <div className="min-h-screen flex flex-col font-sans bg-base-100">
              <Navbar />
              <SurveyBanner />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/chatbot" element={<UserOnlyRoute><ProtectedRoute><BotDashboard /></ProtectedRoute></UserOnlyRoute>}>
                    <Route path=":id" element={<UserOnlyRoute><ProtectedRoute><ChatPage /></ProtectedRoute></UserOnlyRoute>} />
                    <Route path="new" element={<UserOnlyRoute><ProtectedRoute><ChatPage /></ProtectedRoute></UserOnlyRoute>} />
                  </Route>

                  <Route path="/daily-quiz" element={<UserOnlyRoute><ProtectedRoute><DailyQuiz /></ProtectedRoute></UserOnlyRoute>} />
                  <Route path="/journal" element={<UserOnlyRoute><ProtectedRoute><Journal /></ProtectedRoute></UserOnlyRoute>} />
                  <Route path="/helplines" element={<UserOnlyRoute><ProtectedRoute><Helplines /></ProtectedRoute></UserOnlyRoute>} />
                  <Route path="/diagnosis" element={<UserOnlyRoute><ProtectedRoute><DiagnosisPage /></ProtectedRoute></UserOnlyRoute>} />
                  <Route path="/insights" element={<Insights />} />
                  <Route path="/profile" element={<UserOnlyRoute><ProtectedRoute><Profile /></ProtectedRoute></UserOnlyRoute>} />
                  <Route path="/profile/edit" element={<UserOnlyRoute><ProtectedRoute><EditProfile /></ProtectedRoute></UserOnlyRoute>} />
                  <Route path="/verify-account" element={<UserOnlyRoute><ProtectedRoute><VerifyAccount /></ProtectedRoute></UserOnlyRoute>} />
                  <Route path="/settings" element={<UserOnlyRoute><ProtectedRoute><Settings /></ProtectedRoute></UserOnlyRoute>} />
                  <Route path="/anxiety-quiz" element={<UserOnlyRoute><ProtectedRoute><AnxietyQuiz /></ProtectedRoute></UserOnlyRoute>} />
                  <Route path="/depression-quiz" element={<UserOnlyRoute><ProtectedRoute><DepressionQuiz /></ProtectedRoute></UserOnlyRoute>} />
                  <Route path="/sleep-quiz" element={<UserOnlyRoute><ProtectedRoute><SleepQuiz /></ProtectedRoute></UserOnlyRoute>} />
                  <Route path="/stress-quiz" element={<UserOnlyRoute><ProtectedRoute><StressQuiz /></ProtectedRoute></UserOnlyRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          }
          path="*"
        />
      </Routes>
    </Router>
  );
}

export default App;
