import React, { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import Card from '../ui/Card';
import FormInput from '../ui/FormInput';
import Button from '../ui/Button';
import Message from '../ui/Message';

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

export default AuthForm;