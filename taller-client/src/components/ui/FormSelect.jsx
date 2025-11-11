import React from 'react';

const FormSelect = ({ id, label, value, onChange, options, required = false, icon: Icon = null, placeholder = "Select an option...", disabled = false }) => (
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
                disabled={disabled}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out bg-white appearance-none ${Icon ? 'pl-10' : ''} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
                <option value="" disabled>{placeholder}</option>
                {options.map(option => (
                    <option key={option.id || option.value || option} value={String(option.id || option.value || option)}>
                        {option.name || option.label || String(option).toUpperCase()}
                    </option>
                ))}
            </select>
            <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
    </div>
);

export default FormSelect;