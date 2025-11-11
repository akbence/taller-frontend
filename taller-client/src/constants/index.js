// --- API Configuration ---
// This URL assumes your Spring Boot API is running on port 8080.
export const BASE_URL = 'http://localhost:8080/api/v1';

// --- Global Data for Select Inputs ---
export const ACCOUNT_TYPES = ['CHECKING', 'SAVINGS', 'CASH'];
export const TRANSACTION_TYPES = ['EXPENSE', 'INCOME', 'TRANSFER'];

// --- NEW STATIC CURRENCY LIST ---
/**
 * Static list of currencies as requested: EUR, USD, HUF.
 * Formatted for use with the existing FormSelect component logic.
 */
export const STATIC_CURRENCIES = [
    { value: 'EUR', label: 'EUR' },
    { value: 'USD', label: 'USD' },
    { value: 'HUF', label: 'HUF' },
];