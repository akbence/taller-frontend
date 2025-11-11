import React, { useState, useEffect, useCallback } from 'react';
import { Send, DollarSign, MapPin, Clock, List, LayoutList, RefreshCw, Briefcase } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { TRANSACTION_TYPES, STATIC_CURRENCIES } from '../../constants';
import Card from '../ui/Card';
import FormInput from '../ui/FormInput';
import FormSelect from '../ui/FormSelect';
import Button from '../ui/Button';
import Message from '../ui/Message';

const TransactionForm = ({ token, user, onCompletion }) => {
    const { fetchApi } = useApi(token);

    // States for dynamically fetched data
    const [containers, setContainers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [accounts, setAccounts] = useState([]);

    // States for form inputs (matching AccountTransactionDto)
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [transactionType, setTransactionType] = useState(TRANSACTION_TYPES[0]);
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

export default TransactionForm;