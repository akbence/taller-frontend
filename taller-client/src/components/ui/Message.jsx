import React from 'react';

const Message = ({ message }) => {
    if (!message) return null;
    return (
        <p className={`mt-4 p-3 rounded-lg text-sm text-center ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
        </p>
    );
};

export default Message;