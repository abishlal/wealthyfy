import React from 'react';
import { Link, Outlet } from 'react-router-dom';

const MainLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Finance Tracker</h1>
                    <nav className="flex space-x-4">
                        <Link to="/" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Dashboard</Link>
                        <Link to="/daily" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Daily</Link>
                        <Link to="/monthly" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Monthly</Link>
                        <Link to="/expenses" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Expenses</Link>
                        <Link to="/income" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Income</Link>
                        <Link to="/liabilities" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Liabilities</Link>
                        <Link to="/investments" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Investments</Link>
                        <Link to="/settings" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Settings</Link>
                    </nav>
                </div>
            </header>
            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                <Outlet />
            </main>
            <footer className="bg-white border-t mt-auto">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
                    &copy; {new Date().getFullYear()} Personal Finance Tracker
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
