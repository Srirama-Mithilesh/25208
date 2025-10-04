import { FC, ReactElement } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import InventoryPage from './pages/InventoryPage';
import PlannerPage from './pages/PlannerPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import Layout from './components/Layout';
import { Role } from './types';
import LogisticsMapPage from './pages/LogisticsMapPage';

const ProtectedRoute: FC<{ children: ReactElement; roles?: Role[] }> = ({ children, roles }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
     return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppRoutes: FC = () => {
    const { user } = useAuth();

    if (!user) {
        return (
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        );
    }
    
    return (
        <Layout>
            <Routes>
                <Route path="/login" element={<Navigate to="/dashboard" />} />
                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute roles={[Role.ADMIN]}><OrdersPage /></ProtectedRoute>} />
                <Route path="/inventory" element={<ProtectedRoute roles={[Role.ADMIN, Role.BASE_MANAGER]}><InventoryPage /></ProtectedRoute>} />
                <Route path="/planner" element={<ProtectedRoute roles={[Role.ADMIN, Role.BASE_MANAGER]}><PlannerPage /></ProtectedRoute>} />
                <Route path="/map" element={<ProtectedRoute><LogisticsMapPage /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
        </Layout>
    );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
          <DataProvider>
              <HashRouter>
                  <AppRoutes />
              </HashRouter>
          </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;