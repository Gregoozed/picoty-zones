import { Routes, Route, Navigate } from 'react-router-dom';
import UserProvider from './contexts/UserProvider';
import LoginPage from './pages/LoginPage';
import ZonesPage from './pages/ZonesPage';

function App() {
  return (
    <UserProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ZonesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </UserProvider>
  );
}

export default App;
