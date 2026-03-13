import { Routes, Route, Navigate } from 'react-router-dom';
import SupportPage from './pages/SupportPage';

export default function App() {
  return (
    <Routes>
      <Route path="/support" element={<SupportPage />} />
      {/* Redirect root to support for now — extend as website grows */}
      <Route path="/" element={<Navigate to="/support" replace />} />
    </Routes>
  );
}
