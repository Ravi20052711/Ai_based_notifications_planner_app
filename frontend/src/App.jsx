import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DailyPlan from './pages/DailyPlan';
import GoalBreakdown from './pages/GoalBreakdown';
import Admin from './pages/Admin';

const Layout = ({ children }) => (
  <div className="bg-slate-50 dark:bg-slate-900 min-h-screen transition-colors">
    <Navbar />
    <main className="w-full">
      {children}
    </main>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Main App Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/planner"
            element={
              <ProtectedRoute>
                <Layout><DailyPlan /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/goals"
            element={
              <ProtectedRoute>
                <Layout><GoalBreakdown /></Layout>
              </ProtectedRoute>
            }
          />
          
          {/* Admin Routes - Fixed path as requested */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Layout><Admin /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/login/admin"
            element={
              <ProtectedRoute>
                <Layout><Admin /></Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
