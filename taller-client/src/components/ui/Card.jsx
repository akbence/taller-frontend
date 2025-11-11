import React from 'react';

const Card = ({ title, children }) => (
    <div className="bg-white p-6 shadow-2xl rounded-xl w-full max-w-lg transition-all duration-300 hover:shadow-3xl">
        <h2 className="text-3xl font-extrabold text-gray-800 mb-6 border-b pb-2">{title}</h2>
        {children}
    </div>
);

export default Card;