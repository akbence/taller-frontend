import React from 'react';

const FormInput = ({ id, label, type = 'text', value, onChange, placeholder, required = false, icon: Icon = null, step, disabled = false }) => (
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
                disabled={disabled}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out ${Icon ? 'pl-10' : ''} ${disabled ? 'bg-gray-100' : ''}`}
            />
        </div>
    </div>
);

export default FormInput;