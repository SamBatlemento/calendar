import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import CoachDashboard from './pages/CoachDashboard';
import MemberDashboard from './pages/MemberDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/coach"
            element={<ProtectedRoute role="coach"><CoachDashboard /></ProtectedRoute>}
          />
          <Route
            path="/member"
            element={<ProtectedRoute role="member"><MemberDashboard /></ProtectedRoute>}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
