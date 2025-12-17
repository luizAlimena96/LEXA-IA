"use client";

import { useRef } from "react";
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
    const inputRef = useRef<HTMLInputElement>(null);

    const handleIconClick = () => {
        if (inputRef.current) {
            inputRef.current.showPicker?.();
            inputRef.current.focus();
        }
    };

    return (
        <div className={`relative ${className}`}>
            <input
                ref={inputRef}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
                style={{ colorScheme: 'dark' }}
                className="w-full px-4 py-2 pr-10 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#12121d] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-indigo-500 focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-indigo-500/20 transition-all duration-200 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
            <Icon
                onClick={handleIconClick}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-300 cursor-pointer hover:text-gray-600 dark:hover:text-gray-100 transition-colors pointer-events-auto"
            />
        </div>
    );
}
