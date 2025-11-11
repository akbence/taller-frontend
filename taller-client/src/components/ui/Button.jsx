import React from 'react';

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

export default Button;