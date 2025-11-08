import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@/App.css';
import axios from 'axios';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import PhotographerDashboard from './pages/PhotographerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PhotographerProfile from './pages/PhotographerProfile';
import PhotographerPortfolio from './pages/PhotographerPortfolio';
import AboutMe from './pages/aboutMe';
import RestrictedPage from "@/pages/RestrictedPage";

<Route path="/restricted" element={<RestrictedPage />} />

import 'react-phone-number-input/style.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Ignore ResizeObserver loop errors
window.addEventListener('error', (event) => {
  if (event.message && event.message.includes('ResizeObserver loop')) {
    event.stopImmediatePropagation();
    console.warn('ResizeObserver loop error suppressed.');
  }
});

// Axios interceptors for authentication
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Protected route wrapper
function ProtectedRoute({ children, allowedRoles }) {
  let user = null;
  const token = localStorage.getItem('access_token');

  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch {
    user = null;
  }

  if (!token || !user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/user/dashboard"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/photographer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['photographer']}>
                <PhotographerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/photographer/:id" element={<PhotographerProfile />} />
          <Route path="/photographer/:id/portfolio" element={<PhotographerPortfolio />} />

          {/* About Me Routes */}
          <Route
            path="/photographer/about-me/create"
            element={
              <ProtectedRoute allowedRoles={['photographer']}>
                <AboutMe mode="create" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/photographer/about-me/edit"
            element={
              <ProtectedRoute allowedRoles={['photographer']}>
                <AboutMe mode="edit" />
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export { API, toast };
export default App;
