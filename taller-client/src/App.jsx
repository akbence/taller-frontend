import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LogIn, UserPlus, Send, Briefcase, DollarSign, Plus, Trash2, MapPin, Clock, List, LayoutList, RefreshCw } from 'lucide-react';

// --- API Configuration ---
// This URL assumes your Spring Boot API is running on port 8080.
const BASE_URL = 'http://localhost:8080/api/v1';

// --- Global Data for Select Inputs ---
const ACCOUNT_TYPES = ['CHECKING', 'SAVINGS', 'BROKERAGE', 'CASH', 'CREDIT'];
const TRANSACTION_TYPES = ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER'];

// --- NEW STATIC CURRENCY LIST ---
/**
 * Static list of currencies as requested: EUR, USD, HUF.
 * Formatted for use with the existing FormSelect component logic.
 */
const STATIC_CURRENCIES = [
    { value: 'EUR', label: 'EUR' },
    { value: 'USD', label: 'USD' },
    { value: 'HUF', label: 'HUF' },
];

/**
 * Custom hook for making authenticated and unauthenticated API calls with retry logic.
 * @param {string} token - The JWT token for authorization.
 */
const useApi = (token) => {
    // Core fetching logic with headers and body handling
    const fetchCore = useCallback(async (url, method, headers, body) => {
        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null,
        });

        if (response.status === 401) {
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
    }, []);

    // Fetch API with exponential backoff for robustness
    const fetchApi = useCallback(async (endpoint, method = 'GET', body = null, retries = 3) => {
        const url = `${BASE_URL}${endpoint}`;
        const headers = { 'Content-Type': 'application/json' };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        for (let i = 0; i < retries; i++) {
            try {
                return await fetchCore(url, method, headers, body);
            } catch (error) {
                // If it's the last attempt or an unrecoverable error (like 401), re-throw immediately
                if (i === retries - 1 || error.message.includes('Unauthorized')) {
                    throw error;
                }
                // Exponential backoff
                const delay = Math.pow(2, i) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }, [token, fetchCore]);

    return { fetchApi };
};

// --- Shared UI Components ---

const Card = ({ title, children }) => (
    <div className="bg-white p-6 shadow-2xl rounded-xl w-full max-w-lg transition-all duration-300 hover:shadow-3xl">
        <h2 className="text-3xl font-extrabold text-gray-800 mb-6 border-b pb-2">{title}</h2>
        {children}
    </div>
);

const FormInput = ({ id, label, type = 'text', value, onChange, placeholder, required = false, icon: Icon = null, step }) => (
    <div className="mb-4">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />}
            <input
                type={type}
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
                step={step}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out ${Icon ? 'pl-10' : ''}`}
            />
        </div>
    </div>
);

const FormSelect = ({ id, label, value, onChange, options, required = false, icon: Icon = null, placeholder = "Select an option..." }) => (
    <div className="mb-4">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />}
            <select
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out bg-white appearance-none ${Icon ? 'pl-10' : ''}`}
            >
                <option value="" disabled>{placeholder}</option>
                {options.map(option => (
                    <option key={option.id || option.value || option} value={String(option.id || option.value || option)}>
                        {option.name || option.label || option.toUpperCase()}
                    </option>
                ))}
            </select>
            <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
    </div>
);

const Button = ({ children, onClick, disabled = false, type = 'primary', className = '' }) => {
    let baseStyle;
    switch (type) {
        case 'secondary':
            baseStyle = 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-400/50';
            break;
        case 'danger':
            baseStyle = 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500/50';
            break;
        case 'success':
            baseStyle = 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500/50';
            break;
        case 'primary':
        default:
            baseStyle = 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500/50';
            break;
    }

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors duration-200 shadow-md focus:outline-none focus:ring-4 ${baseStyle} ${disabled ? 'opacity-50 cursor-not-allowed' : ''
                } ${className}`}
        >
            {children}
        </button>
    );
};

const Message = ({ message }) => {
    if (!message) return null;
    return (
        <p className={`mt-4 p-3 rounded-lg text-sm text-center ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
        </p>
    );
};


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
            } else {
                // Create User (Register)
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
                    className={`flex-1 py-2 font-medium transition-colors ${isLogin ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-indigo-600'
                        }`}
                    onClick={() => { setIsLogin(true); setMessage(''); }}
                >
                    <LogIn className="inline w-4 h-4 mr-2" /> Login
                </button>
                <button
                    className={`flex-1 py-2 font-medium transition-colors ${!isLogin ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-indigo-600'
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
                required
            />
            <FormInput
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="enter password"
                required
            />

            <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? 'Processing...' : buttonText}
            </Button>

            <Message message={message} />
        </Card>
    );
};

const AccountContainerForm = ({ token, user, onCompletion }) => {
    // Helper function to create a new account object with defaults
    const newAccount = () => ({
        id: Date.now(),
        name: '',
        accountType: ACCOUNT_TYPES[0], // CHECKING
        currency: STATIC_CURRENCIES[0].value, // Default currency is now EUR
        initialBalance: 0
    });

    const [containerName, setContainerName] = useState('');
    const [accounts, setAccounts] = useState([newAccount()]);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { fetchApi } = useApi(token);

    const addAccount = () => {
        setAccounts([...accounts, newAccount()]);
    };

    const removeAccount = (id) => {
        setAccounts(accounts.filter(acc => acc.id !== id));
    };

    const updateAccount = (id, field, value) => {
        setAccounts(accounts.map(acc =>
            acc.id === id ? { ...acc, [field]: value } : acc
        ));
    };

    const handleSubmit = async () => {
        setMessage('');
        setIsLoading(true);

        if (!containerName.trim()) {
            setMessage('Please enter an Account Container Name.');
            setIsLoading(false);
            return;
        }

        const validAccounts = accounts.filter(acc => acc.name.trim() !== '');
        if (validAccounts.length === 0) {
            setMessage('Please create at least one Account.');
            setIsLoading(false);
            return;
        }

        const subaccountsPayload = validAccounts.map(acc => ({
            name: acc.name.trim(),
            accountType: acc.accountType,
            currency: acc.currency,
            initialBalance: parseFloat(acc.initialBalance) || 0,
        }));

        const body = {
            name: containerName.trim(),
            subaccounts: subaccountsPayload,
        };

        try {
            const result = await fetchApi('/account-container', 'POST', body);
            setMessage(`Account Container '${result.name}' created successfully with ${result.subaccounts.length} accounts!`);
            setContainerName('');
            setAccounts([newAccount()]); // Reset form
        } catch (error) {
            setMessage(error.message || 'Failed to create account container.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card title="Create Account Container">
            <FormInput
                id="containerName"
                label="Account Container Name"
                value={containerName}
                onChange={setContainerName}
                placeholder="e.g., Personal Finances, Business Account"
                required
                icon={Briefcase}
            />

            <div className="mb-4 p-3 text-sm bg-gray-50 rounded-lg text-gray-600">
                Owner: <span className="font-semibold text-indigo-600">{user}</span>
            </div>

            <h3 className="text-xl font-bold text-gray-700 mb-3 mt-6 border-t pt-4 flex justify-between items-center">
                Accounts
                <button
                    onClick={addAccount}
                    className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 transition-colors font-medium p-1 rounded-full"
                >
                    <Plus className="w-4 h-4 mr-1" /> Add
                </button>
            </h3>

            {accounts.map((account, index) => (
                <div key={account.id} className="p-4 border border-gray-200 rounded-lg mb-4 bg-white shadow-inner">
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-600">Account {index + 1}</h4>
                        {accounts.length > 1 && (
                            <button onClick={() => removeAccount(account.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <FormInput
                        id={`accountName-${account.id}`}
                        label="Name"
                        value={account.name}
                        onChange={(val) => updateAccount(account.id, 'name', val)}
                        placeholder="e.g., Checking, Savings"
                        required
                    />

                    <FormSelect
                        id={`accountType-${account.id}`}
                        label="Account Type"
                        value={account.accountType}
                        onChange={(val) => updateAccount(account.id, 'accountType', val)}
                        options={ACCOUNT_TYPES.map(type => ({ value: type, label: type }))}
                        required
                    />

                    {/* Currency Dropdown: Changed to use STATIC_CURRENCIES and FormSelect */}
                    <FormSelect
                        id={`currency-${account.id}`}
                        label="Currency"
                        value={account.currency}
                        onChange={(val) => updateAccount(account.id, 'currency', val)}
                        options={STATIC_CURRENCIES}
                        required
                        icon={DollarSign}
                        placeholder="Select Currency"
                    />


                    <FormInput
                        id={`initialBalance-${account.id}`}
                        label="Initial Balance"
                        type="number"
                        step="0.01"
                        value={account.initialBalance}
                        onChange={(val) => updateAccount(account.id, 'initialBalance', val)}
                        placeholder="0.00"
                    />
                </div>
            ))}


            <Button onClick={handleSubmit} disabled={isLoading || !containerName || accounts.filter(acc => acc.name.trim()).length === 0} className="mt-6">
                <Briefcase className="inline w-4 h-4 mr-2 align-middle" />
                {isLoading ? 'Creating...' : 'Create Container & Accounts'}
            </Button>

            <button
                onClick={onCompletion}
                className="w-full mt-2 py-2 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
            >
                Go to Transactions
            </button>

            <Message message={message} />
        </Card>
    );
};

const TransactionForm = ({ token, user, onCompletion }) => {
    const { fetchApi } = useApi(token);

    // States for dynamically fetched data
    // const [currencies, setCurrencies] = useState([]); // REMOVED
    const [containers, setContainers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [accounts, setAccounts] = useState([]);

    // States for form inputs (matching AccountTransactionDto)
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [transactionType, setTransactionType] = useState(TRANSACTION_TYPES[0]); // DEPOSIT
    const [selectedContainerId, setSelectedContainerId] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    // Initialize selectedCurrency with a default from the static list
    const [selectedCurrency, setSelectedCurrency] = useState(STATIC_CURRENCIES[0].value);

    // UI/Loading States
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);

    // --- Data Fetching Logic ---

    // Fetch Categories and Containers on component mount
    const loadInitialData = useCallback(async () => {
        setIsDataLoading(true);
        setMessage('');
        try {
            // REMOVED: Currency fetch logic (const currencyResult = await fetchApi('/currency');)
            // setCurrencies(currencyResult.map(c => ({ value: c, label: c })));
            // if (currencyResult.length > 0) setSelectedCurrency(currencyResult[0]); 

            // Fetch Containers
            const containerResult = await fetchApi('/account-container');
            setContainers(containerResult.map(c => ({ id: c.id, name: c.name })));

            // Fetch Categories
            // NOTE: Assuming /category returns an array of objects with { id, name }
            const categoryResult = await fetchApi('/category');
            setCategories(categoryResult.map(c => ({ id: c.id, name: c.name })));

        } catch (error) {
            setMessage(`Failed to load necessary data: ${error.message}`);
        } finally {
            setIsDataLoading(false);
        }
    }, [fetchApi]);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    // Fetch Accounts when a Container is selected
    useEffect(() => {
        if (!selectedContainerId) {
            setAccounts([]);
            setSelectedAccountId('');
            return;
        }

        const loadAccounts = async () => {
            setMessage('');
            try {
                // NOTE: Assuming endpoint /account-container/{containerId}/accounts
                const accountResult = await fetchApi(`/account-container/${selectedContainerId}/accounts`);
                setAccounts(accountResult.map(a => ({ id: a.id, name: `${a.name} (${a.currency})` })));
            } catch (error) {
                setMessage(`Failed to load accounts: ${error.message}`);
            }
        };

        loadAccounts();
    }, [selectedContainerId, fetchApi]);

    // --- Geolocation Logic ---
    const getLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLatitude(position.coords.latitude.toFixed(6));
                    setLongitude(position.coords.longitude.toFixed(6));
                    setMessage('Geolocation captured successfully.');
                },
                (error) => {
                    setMessage(`Geolocation error: ${error.message}`);
                    console.error('Geolocation Error:', error);
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            setMessage('Geolocation is not supported by this browser.');
        }
    };


    // --- Form Submission ---

    const handleSubmit = async () => {
        setMessage('');
        setIsLoading(true);

        const parsedAmount = parseFloat(amount);
        const parsedLat = parseFloat(latitude) || 0;
        const parsedLon = parseFloat(longitude) || 0;

        if (!description.trim() || isNaN(parsedAmount) || !selectedAccountId || !selectedCategoryId) {
            setMessage('Please fill out Description, Amount, Account, and Category.');
            setIsLoading(false);
            return;
        }

        // Ensure transactionTime is ISO 8601 compliant (backend expects Instant)
        const transactionTime = new Date().toISOString();

        // Payload structure matching the AccountTransactionDto
        const body = {
            description: description.trim(),
            amount: parsedAmount,
            latitude: parsedLat,
            longitude: parsedLon,
            transactionTime: transactionTime,
            transactionType: transactionType,
            account: { id: selectedAccountId }, // DTO expects an AccountDto with ID
            category: { id: selectedCategoryId } // DTO expects a CategoryDto with ID
        };

        try {
            // NOTE: Assuming the POST endpoint is /transaction
            const result = await fetchApi('/transaction', 'POST', body);
            setMessage(`Transaction '${result.description}' of ${parsedAmount} ${selectedCurrency} created successfully!`);

            // Reset form fields
            setDescription('');
            setAmount('');
            setLatitude('');
            setLongitude('');
            // Keep selected account/category for quick follow-up

        } catch (error) {
            setMessage(error.message || 'Failed to create transaction.');
        } finally {
            setIsLoading(false);
        }
    };

    const isSubmitDisabled = isLoading || isDataLoading || !description.trim() || isNaN(parseFloat(amount)) || !selectedAccountId || !selectedCategoryId;

    return (
        <Card title="Create Account Transaction">
            <div className="mb-4 p-3 text-sm bg-gray-50 rounded-lg text-gray-600 flex justify-between items-center">
                User: <span className="font-semibold text-indigo-600">{user}</span>
                <button
                    onClick={loadInitialData}
                    disabled={isDataLoading}
                    className="flex items-center text-xs text-gray-500 hover:text-indigo-600 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-3 h-3 mr-1 ${isDataLoading ? 'animate-spin' : ''}`} /> Reload Data
                </button>
            </div>

            {isDataLoading && (
                <div className="p-4 text-center text-indigo-600 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Loading Account Data...
                </div>
            )}

            <FormInput
                id="description"
                label="Transaction Description"
                value={description}
                onChange={setDescription}
                placeholder="e.g., Grocery Shopping, Monthly Salary"
                required
                icon={List}
            />

            {/* Currency Selector (Now using STATIC_CURRENCIES) */}
            <FormSelect
                id="currency"
                label="Currency"
                value={selectedCurrency}
                onChange={setSelectedCurrency}
                options={STATIC_CURRENCIES}
                required
                icon={DollarSign}
                placeholder="Select Currency"
            />

            <FormInput
                id="amount"
                label="Amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={setAmount}
                placeholder="Amount (e.g., 100.00)"
                required
                icon={DollarSign}
            />

            {/* Account Container Selector (Fetched from server) */}
            <FormSelect
                id="containerId"
                label="Account Container"
                value={selectedContainerId}
                onChange={(value) => {
                    setSelectedContainerId(value);
                    setSelectedAccountId('');
                }}
                options={containers}
                required
                icon={Briefcase}
                placeholder="Select Container"
            />

            {/* Account Selector (Dynamically populated) */}
            <FormSelect
                id="accountId"
                label="Account"
                value={selectedAccountId}
                onChange={setSelectedAccountId}
                options={accounts}
                required
                icon={LayoutList}
                placeholder={selectedContainerId ? "Select Account" : "Select a Container first"}
                disabled={!selectedContainerId || accounts.length === 0}
            />

            {/* Category Selector (Fetched from server) */}
            <FormSelect
                id="categoryId"
                label="Category"
                value={selectedCategoryId}
                onChange={setSelectedCategoryId}
                options={categories}
                required
                icon={List}
                placeholder="Select Category"
            />

            {/* Transaction Type (Enum) */}
            <FormSelect
                id="transactionType"
                label="Transaction Type"
                value={transactionType}
                onChange={setTransactionType}
                options={TRANSACTION_TYPES.map(type => ({ value: type, label: type }))}
                required
                icon={Send}
            />

            <div className="flex items-end space-x-2">
                <div className="flex-1">
                    <FormInput
                        id="latitude"
                        label="Latitude"
                        type="number"
                        step="0.000001"
                        value={latitude}
                        onChange={setLatitude}
                        placeholder="0.0"
                        icon={MapPin}
                    />
                </div>
                <div className="flex-1">
                    <FormInput
                        id="longitude"
                        label="Longitude"
                        type="number"
                        step="0.000001"
                        value={longitude}
                        onChange={setLongitude}
                        placeholder="0.0"
                        icon={MapPin}
                    />
                </div>
                <button onClick={getLocation} type="button" className="p-3 mb-4 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors shadow-sm self-stretch">
                    <MapPin className="w-5 h-5" />
                </button>
            </div>

            <FormInput
                id="transactionTime"
                label="Transaction Time (Auto-filled on submit)"
                type="text"
                value={new Date().toLocaleTimeString()}
                onChange={() => { }} // Disabled input shows current time
                icon={Clock}
                disabled={true}
            />

            <Button onClick={handleSubmit} disabled={isSubmitDisabled} className="mt-6">
                <Send className="inline w-4 h-4 mr-2 align-middle" />
                {isLoading ? 'Creating...' : 'Create Transaction'}
            </Button>

            <button
                onClick={onCompletion}
                className="w-full mt-2 py-2 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
            >
                Go to Account Container Creation
            </button>

            <Message message={message} />
        </Card>
    );
};


// --- Main Application ---

const App = () => {
    // State to manage authentication
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);

    // State for simple routing: 'auth', 'accountContainer', 'transaction'
    const [view, setView] = useState('auth');

    const handleAuthSuccess = (username, jwtToken) => {
        setUser(username);
        setToken(jwtToken);
        setView('accountContainer'); // Move to account creation after login
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