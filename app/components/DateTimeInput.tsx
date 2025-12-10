"use client";

import { CalendarDays, Clock } from "lucide-react";

interface DateTimeInputProps {
    type: "date" | "time";
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
    required?: boolean;
}

export default function DateTimeInput({
    type,
    value,
    onChange,
    className = "",
    placeholder,
    required = false,
}: DateTimeInputProps) {
    const Icon = type === "date" ? CalendarDays : Clock;

    return (
        <div className={`relative ${className}`}>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
                style={{ colorScheme: 'dark' }}
                className="w-full px-4 py-2 pr-10 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#12121d] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-indigo-500 focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-indigo-500/20 transition-all duration-200 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden [&::-webkit-clear-button]:hidden"
            />
            <Icon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-300 pointer-events-none" />
            {/* Invisible overlay to trigger native date/time picker */}
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                tabIndex={-1}
            />
        </div>
    );
}
