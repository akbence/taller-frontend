import { useCallback } from 'react';
import { BASE_URL } from '../constants';

/**
 * Custom hook for making authenticated and unauthenticated API calls with retry logic.
 * @param {string} token - The JWT token for authorization.
 */
export const useApi = (token) => {
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