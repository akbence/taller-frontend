import React, { useState, useEffect, useCallback } from 'react';
import { LogIn, UserPlus, Send, Briefcase, DollarSign, Home } from 'lucide-react';

// --- API Configuration ---
const BASE_URL = 'http://localhost:8080/api/v1';

/**
 * Custom hook for making authenticated and unauthenticated API calls.
 * @param {string} token - The JWT token for authorization.
 */
const useApi = (token) => {
    const fetchApi = useCallback(async (endpoint, method = 'GET', body = null) => {
        const url = `${BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                method,
                headers,
                body: body ? JSON.stringify(body) : null,
            });

            if (response.status === 401) {
                // If unauthorized, token is likely expired or invalid
                throw new Error('Unauthorized. Please log in again.');
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown server error' }));
                throw new Error(errorData.message || `API call failed with status: ${response.status}`);
            }

            // Handle 204 No Content responses
            if (response.status === 204 || method === 'DELETE') {
                return null;
            }

            return response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error; // Re-throw the error for component to handle
        }
    }, [token]);

    return { fetchApi };
};

// --- Shared UI Components ---

const Card = ({ title, children }) => (
    <div className="bg-white p-6 shadow-2xl rounded-xl w-full max-w-md transition-all duration-300 hover:shadow-3xl">
        <h2 className="text-3xl font-extrabold text-gray-800 mb-6 border-b pb-2">{title}</h2>
        {children}
    </div>
);

const FormInput = ({ id, label, type = 'text', value, onChange, placeholder }) => (
    <div className="mb-4">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
        </label>
        <input
            type={type}
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
        />
    </div>
);

const Button = ({ children, onClick, disabled = false }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors duration-200 shadow-md ${
            disabled
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/50'
        }`}
    >
        {children}
    </button>
);

// --- Feature Components ---

const AuthForm = ({ onAuthSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Unauthenticated API hook
    const { fetchApi } = useApi(null);

    const handleSubmit = async () => {
        setMessage('');
        setIsLoading(true);

        const endpoint = isLogin ? '/user/login' : '/user';
        const method = 'POST';
        const body = { username, password };

        try {
            if (isLogin) {
                // Login
                const result = await fetchApi(endpoint, method, body);
                onAuthSuccess(username, result.token);
                setMessage(`Login successful! Welcome, ${username}.`);
            } else {
                // Create User (Register)
                // Note: Assuming /user POST endpoint accepts username/password even though UserDto is minimalist.
                const result = await fetchApi(endpoint, method, body);
                setMessage(`User '${result.username}' created successfully! Please log in.`);
                setIsLogin(true); // Switch to login after registration
            }
        } catch (error) {
            setMessage(error.message || 'An error occurred during authentication.');
        } finally {
            setIsLoading(false);
        }
    };

    const title = isLogin ? 'User Login' : 'Create New User';
    const buttonText = isLogin ? 'Login' : 'Register';

    return (
        <Card title={title}>
            <div className="flex mb-6 border-b">
                <button
                    className={`flex-1 py-2 font-medium transition-colors ${
                        isLogin ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-indigo-600'
                    }`}
                    onClick={() => { setIsLogin(true); setMessage(''); }}
                >
                    <LogIn className="inline w-4 h-4 mr-2" /> Login
                </button>
                <button
                    className={`flex-1 py-2 font-medium transition-colors ${
                        !isLogin ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-indigo-600'
                    }`}
                    onClick={() => { setIsLogin(false); setMessage(''); }}
                >
                    <UserPlus className="inline w-4 h-4 mr-2" /> Register
                </button>
            </div>

            <FormInput
                id="username"
                label="Username"
                value={username}
                onChange={setUsername}
                placeholder="enter username"
            />
            <FormInput
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="enter password"
            />

            <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? 'Processing...' : buttonText}
            </Button>

            {message && (
                <p className={`mt-4 p-3 rounded-lg text-sm text-center ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message}
                </p>
            )}
        </Card>
    );
};

const AccountForm = ({ token, user, onCompletion }) => {
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { fetchApi } = useApi(token);

    const handleSubmit = async () => {
        setMessage('');
        setIsLoading(true);

        const body = {
            name,
            // Keeping subaccounts simple for this initial implementation
            subaccounts: []
        };

        try {
            const result = await fetchApi('/account', 'POST', body);
            setMessage(`Account '${result.name}' created successfully!`);
            setName('');
        } catch (error) {
            setMessage(error.message || 'Failed to create account.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card title="Create Account">
            <FormInput
                id="accountName"
                label="Account Name"
                value={name}
                onChange={setName}
                placeholder="e.g., Main Checking, Savings Goal"
            />

            <div className="mb-4 p-3 text-sm bg-gray-50 rounded-lg text-gray-600">
                Owner: <span className="font-semibold text-indigo-600">{user}</span>
            </div>

            <Button onClick={handleSubmit} disabled={isLoading || !name}>
                <Briefcase className="inline w-4 h-4 mr-2 align-middle" />
                {isLoading ? 'Creating...' : 'Create Account'}
            </Button>
            <button
                onClick={onCompletion}
                className="w-full mt-2 py-2 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
            >
                Go to Transactions
            </button>

            {message && (
                <p className={`mt-4 p-3 rounded-lg text-sm text-center ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message}
                </p>
            )}
        </Card>
    );
};

const TransactionForm = ({ token, user, onCompletion }) => {
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [source, setSource] = useState('');
    const [target, setTarget] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { fetchApi } = useApi(token);

    const handleSubmit = async () => {
        setMessage('');
        setIsLoading(true);

        const body = {
            amount: parseFloat(amount),
            currency,
            sourceSubAccountId: source,
            targetSubAccountId: target,
            // id and timestamp will be generated by the server
        };

        if (isNaN(body.amount) || !currency || !source || !target) {
            setMessage('Please fill out all fields correctly.');
            setIsLoading(false);
            return;
        }

        try {
            await fetchApi('/transaction', 'POST', body);
            setMessage(`Transaction of ${currency} ${amount} created successfully!`);
            setAmount('');
            setSource('');
            setTarget('');
        } catch (error) {
            setMessage(error.message || 'Failed to create transaction.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card title="Create Transaction">
            <div className="mb-4 p-3 text-sm bg-gray-50 rounded-lg text-gray-600">
                User: <span className="font-semibold text-indigo-600">{user}</span>
            </div>

            <FormInput
                id="amount"
                label="Amount"
                type="number"
                value={amount}
                onChange={setAmount}
                placeholder="Amount (e.g., 100.00)"
            />
            <FormInput
                id="currency"
                label="Currency"
                value={currency}
                onChange={setCurrency}
                placeholder="e.g., USD, EUR"
            />
            <FormInput
                id="sourceId"
                label="Source SubAccount ID"
                value={source}
                onChange={setSource}
                placeholder="e.g., checking-123"
            />
            <FormInput
                id="targetId"
                label="Target SubAccount ID"
                value={target}
                onChange={setTarget}
                placeholder="e.g., savings-456"
            />

            <Button onClick={handleSubmit} disabled={isLoading}>
                <Send className="inline w-4 h-4 mr-2 align-middle" />
                {isLoading ? 'Sending...' : 'Create Transaction'}
            </Button>
            <button
                onClick={onCompletion}
                className="w-full mt-2 py-2 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
            >
                Go to Account Creation
            </button>


            {message && (
                <p className={`mt-4 p-3 rounded-lg text-sm text-center ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message}
                </p>
            )}
        </Card>
    );
};


// --- Main Application ---

const App = () => {
    // State to manage authentication
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);

    // State for simple routing: 'auth', 'account', 'transaction'
    const [view, setView] = useState('auth');

    const handleAuthSuccess = (username, jwtToken) => {
        setUser(username);
        setToken(jwtToken);
        setView('account'); // Move to account creation after login
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
            case 'account':
                return <AccountForm token={token} user={user} onCompletion={() => setView('transaction')} />;
            case 'transaction':
                return <TransactionForm token={token} user={user} onCompletion={() => setView('account')} />;
            default:
                return <AccountForm token={token} user={user} onCompletion={() => setView('transaction')} />;
        }
    };

    const renderNavbar = () => (
        <nav className="flex justify-between items-center w-full max-w-4xl p-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg mb-8">
            <h1 className="text-3xl font-black flex items-center drop-shadow-lg">
                <DollarSign className="w-8 h-8 mr-3 text-indigo-600" />
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    TALLER API CLIENT
                </span>
            </h1>
            {token && (
                <div className="flex space-x-4 items-center">
                    <span className="text-sm font-medium text-gray-600 hidden sm:inline">Logged in as: <span className="font-bold text-indigo-600">{user}</span></span>
                    <button
                        onClick={() => setView('account')}
                        className={`p-2 rounded-lg text-sm font-medium transition-colors flex items-center ${view === 'account' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <Briefcase className="w-4 h-4 mr-1" /> Account
                    </button>
                    <button
                        onClick={() => setView('transaction')}
                        className={`p-2 rounded-lg text-sm font-medium transition-colors flex items-center ${view === 'transaction' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <Send className="w-4 h-4 mr-1" /> Transaction
                    </button>
                    <button
                        onClick={handleLogout}
                        className="py-2 px-3 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors shadow-md"
                    >
                        <LogIn className="w-4 h-4 inline mr-1 align-middle" /> Logout
                    </button>
                </div>
            )}
        </nav>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 font-sans">
            {renderNavbar()}

            <main className="flex justify-center w-full max-w-4xl">
                {renderContent()}
            </main>

            <footer className="mt-12 text-sm text-gray-400 p-4">
                API Base URL: <span className="font-mono text-gray-500">{BASE_URL}</span>
            </footer>
        </div>
    );
};

export default App;
