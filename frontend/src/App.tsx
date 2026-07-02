import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './App.css';
import LoginPage from './pages/LoginPage';
import CoachDashboardPage from './pages/CoachDashboardPage';
import AthleteDashboardPage from './pages/AthleteDashboardPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/coach" element={<CoachDashboardPage />} />
        <Route path="/athlete" element={<AthleteDashboardPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;