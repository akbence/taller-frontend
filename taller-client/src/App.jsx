import React, { useState } from 'react';
import { LogIn, Send, Briefcase, DollarSign } from 'lucide-react';

// Import feature components
import AuthForm from './components/features/AuthForm';
import AccountContainerForm from './components/features/AccountContainerForm';
import TransactionForm from './components/features/TransactionForm';

// --- Main Application ---

const App = () => {
    // State to manage authentication
    const [token, setToken] = useState(() => localStorage.getItem('token') || null);
    const [user, setUser] = useState(() => localStorage.getItem('user') || null);

    // State for simple routing: 'auth', 'accountContainer', 'transaction'
    const [view, setView] = useState(() => (localStorage.getItem('token') ? 'accountContainer' : 'auth'));

    const handleAuthSuccess = (username, jwtToken) => {
        localStorage.setItem('token', jwtToken); 
        localStorage.setItem('user', username); 
        setUser(username);
        setToken(jwtToken);
        setView('accountContainer');
    };

    const handleLogout = () => {
        setToken(null);
        setUser(null);
        setView('auth');
    };

    const renderContent = () => {
        if (!token) {
            return <AuthForm onAuthSuccess={handleAuthSuccess} />;
        }

        switch (view) {
            case 'accountContainer':
                return <AccountContainerForm token={token} user={user} onCompletion={() => setView('transaction')} />;
            case 'transaction':
                return <TransactionForm token={token} user={user} onCompletion={() => setView('accountContainer')} />;
            default:
                return <AccountContainerForm token={token} user={user} onCompletion={() => setView('transaction')} />;
        }
    };

    const renderNavbar = () => (
        <nav className="flex justify-between items-center w-full max-w-4xl p-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg mb-8 fixed top-4 z-10">
            <h1 className="text-3xl font-black flex items-center drop-shadow-lg">
                <DollarSign className="w-8 h-8 mr-3 text-indigo-600" />
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent text-xl sm:text-3xl">
                    TALLER API CLIENT
                </span>
            </h1>
            {token && (
                <div className="flex space-x-2 sm:space-x-4 items-center">
                    <span className="text-xs sm:text-sm font-medium text-gray-600 hidden md:inline">Logged in as: <span className="font-bold text-indigo-600">{user}</span></span>
                    <button
                        onClick={() => setView('accountContainer')}
                        className={`p-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center ${view === 'accountContainer' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <Briefcase className="w-4 h-4 mr-1 hidden sm:inline" /> Containers
                    </button>
                    <button
                        onClick={() => setView('transaction')}
                        className={`p-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center ${view === 'transaction' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <Send className="w-4 h-4 mr-1 hidden sm:inline" /> Txn
                    </button>
                    <button
                        onClick={handleLogout}
                        className="py-2 px-3 bg-red-500 text-white text-xs sm:text-sm rounded-lg hover:bg-red-600 transition-colors shadow-md"
                    >
                        <LogIn className="w-4 h-4 inline mr-1 align-middle" /> Logout
                    </button>
                </div>
            )}
        </nav>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-24 pb-12 px-4">
            {renderNavbar()}
            <main className="w-full max-w-lg">
                {renderContent()}
            </main>
        </div>
    );
};

export default App;