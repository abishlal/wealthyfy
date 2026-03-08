import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth } from 'react-oidc-context';

const MainLayout: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const auth = useAuth();

    const navLinks = [
        { to: "/", label: "Dashboard" },
        { to: "/daily", label: "Daily" },
        { to: "/monthly", label: "Monthly" },
        { to: "/expenses", label: "Expenses" },
        { to: "/income", label: "Income" },
        { to: "/liabilities", label: "Liabilities" },
        { to: "/receivables", label: "Receivables" },
        { to: "/investments", label: "Investments" },
        { to: "/budgets", label: "Budgets" },
        { to: "/planning", label: "Planning" },
        { to: "/settings", label: "Settings" },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <span className="text-xl font-black text-indigo-600 tracking-tighter">WEALTHYFY.</span>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden xl:flex space-x-1 items-center">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className="text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <button
                                onClick={() => auth.removeUser()}
                                className="ml-4 text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-red-50 flex items-center transition-colors"
                                title="Log out"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </nav>

                        {/* Mobile menu button */}
                        <div className="xl:hidden flex items-center">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
                            >
                                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div className="xl:hidden bg-white border-b border-gray-200 shadow-lg absolute w-full">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <button
                                onClick={() => auth.removeUser()}
                                className="flex w-full items-center px-3 py-2 mt-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                            >
                                <LogOut className="h-5 w-5 mr-2" />
                                Logout
                            </button>
                        </div>
                    </div>
                )}
            </header>

            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
                <Outlet />
            </main>

            <footer className="bg-white border-t mt-auto">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                        &copy; {new Date().getFullYear()} Wealthyfy — Your Wealth, Your Control.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
