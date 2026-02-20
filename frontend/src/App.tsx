import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import DailyOverview from './pages/DailyOverview';
import MonthlyDashboard from './pages/MonthlyDashboard';
import Expenses from './pages/Expenses';
import Income from './pages/Income';
import Liabilities from './pages/Liabilities';
import Investments from './pages/Investments';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="daily" element={<DailyOverview />} />
          <Route path="monthly" element={<MonthlyDashboard />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="income" element={<Income />} />
          <Route path="liabilities" element={<Liabilities />} />
          <Route path="investments" element={<Investments />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
