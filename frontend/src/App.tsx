import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import DailyOverview from './pages/DailyOverview';
import MonthlyDashboard from './pages/MonthlyDashboard';
import Expenses from './pages/Expenses';
import Income from './pages/Income';
import Liabilities from './pages/Liabilities';
import Investments from './pages/Investments';
import Settings from './pages/Settings';
import Budgets from './pages/Budgets';
import Planning from './pages/Planning';
import Receivables from './pages/Receivables';
// The axios interceptor is now statically defined in api/axios.ts
// to prevent race conditions on page refresh.

function App() {
  const auth = useAuth();

  // Wait for the auth provider to finish initializing before rendering
  // This prevents Dashboard from fetching before the interceptor has the token
  if (auth.isLoading || auth.activeNavigator) {
    return <div className="flex items-center justify-center min-h-screen text-gray-500">Loading your profile...</div>;
  }

  // Handle errors that occur during the authentication process
  if (auth.error) {
    if (auth.error.message.includes("No matching state found in storage")) {
      window.history.replaceState({}, document.title, window.location.pathname);
      window.location.reload();
      return <div className="flex items-center justify-center min-h-screen text-gray-500">Recovering authentication state...</div>;
    }
    return <div className="flex items-center justify-center min-h-screen text-red-500">Authentication Error: {auth.error.message}</div>;
  }

  // Handle redirect path automatically in case they are not logged in.
  // Although ProtectedRoute handles this, we can also prevent rendering Router entirely.
  // Actually, let's keep it in ProtectedRoute to allow specific public routes if needed.

  return (
    <Router>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="daily" element={<DailyOverview />} />
            <Route path="monthly" element={<MonthlyDashboard />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="income" element={<Income />} />
            <Route path="liabilities" element={<Liabilities />} />
            <Route path="investments" element={<Investments />} />
            <Route path="settings" element={<Settings />} />
            <Route path="budgets" element={<Budgets />} />
            <Route path="planning" element={<Planning />} />
            <Route path="receivables" element={<Receivables />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
