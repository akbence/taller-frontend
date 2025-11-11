import React, { useState } from 'react';
import { Briefcase, DollarSign, Plus, Trash2 } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { ACCOUNT_TYPES, STATIC_CURRENCIES } from '../../constants';
import Card from '../ui/Card';
import FormInput from '../ui/FormInput';
import FormSelect from '../ui/FormSelect';
import Button from '../ui/Button';
import Message from '../ui/Message';

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

export default AccountContainerForm;