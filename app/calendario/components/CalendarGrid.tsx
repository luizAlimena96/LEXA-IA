'use client';

import { Ban } from 'lucide-react';
import type { Event, BlockedSlot } from '@/app/services/calendarService';

interface CalendarGridProps {
    currentDate: Date;
    events: Event[];
    blockedSlots: BlockedSlot[];
    onDateSelect: (date: Date) => void;
    onBlockDay: (date: Date) => void;
    selectedDate: Date | null;
}

const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function CalendarGrid({
    currentDate,
    events,
    blockedSlots,
    onDateSelect,
    onBlockDay,
    selectedDate,
}: CalendarGridProps) {
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const getEventsForDay = (date: Date | null) => {
        if (!date) return [];
        return events.filter(
            (event) =>
                event.date.getDate() === date.getDate() &&
                event.date.getMonth() === date.getMonth() &&
                event.date.getFullYear() === date.getFullYear()
        );
    };

    const isDayBlocked = (date: Date | null) => {
        if (!date) return false;
        return blockedSlots.some(slot =>
            slot.allDay &&
            slot.startTime.getDate() === date.getDate() &&
            slot.startTime.getMonth() === date.getMonth() &&
            slot.startTime.getFullYear() === date.getFullYear()
        );
    };

    const days = getDaysInMonth(currentDate);
    const today = new Date();

    return (
        <div>
            {/* Dias da Semana */}
            <div className="grid grid-cols-7 gap-2 mb-2">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                    <div
                        key={day}
                        className="text-center text-sm font-semibold text-gray-600 dark:text-gray-300 py-2"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid de Dias */}
            <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => {
                    const isToday =
                        day &&
                        day.getDate() === today.getDate() &&
                        day.getMonth() === today.getMonth() &&
                        day.getFullYear() === today.getFullYear();

                    const dayEvents = getEventsForDay(day);
                    const hasEvents = dayEvents.length > 0;
                    const isBlocked = isDayBlocked(day);

                    return (
                        <div key={index} className="relative group">
                            <button
                                onClick={() => day && onDateSelect(day)}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    if (day) onBlockDay(day);
                                }}
                                className={`
                                    w-full aspect-square p-2 rounded-lg transition-all relative
                                    ${!day ? "invisible" : ""}
                                    ${isBlocked ? "bg-red-100 border-2 border-red-300" : ""}
                                    ${isToday && !isBlocked ? "bg-indigo-600 text-white font-bold" : ""}
                                    ${!isToday && !isBlocked && day ? "hover:bg-gray-100 dark:hover:bg-gray-700" : ""}
                                    ${selectedDate?.getDate() === day?.getDate() &&
                                        selectedDate?.getMonth() === day?.getMonth() &&
                                        !isToday && !isBlocked
                                        ? "ring-2 ring-indigo-600"
                                        : ""
                                    }
                                `}
                            >
                                {day && (
                                    <>
                                        <span
                                            className={`text-sm ${isToday ? "" : isBlocked ? "text-red-600 dark:text-red-400 font-semibold" : "text-gray-900 dark:text-gray-100"
                                                }`}
                                        >
                                            {day.getDate()}
                                        </span>
                                        {isBlocked && (
                                            <Ban className="w-3 h-3 text-red-500 absolute top-1 right-1" />
                                        )}
                                        {hasEvents && !isBlocked && (
                                            <div className="flex justify-center mt-1 space-x-1">
                                                {dayEvents.slice(0, 3).map((event) => (
                                                    <div
                                                        key={event.id}
                                                        className={`w-1.5 h-1.5 rounded-full ${event.color}`}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </button>
                            {day && (
                                <button
                                    onClick={() => onBlockDay(day)}
                                    className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white dark:bg-gray-700 rounded-full shadow-md"
                                    title={isBlocked ? "Desbloquear dia" : "Bloquear dia"}
                                >
                                    <Ban className={`w-3 h-3 ${isBlocked ? "text-green-500" : "text-red-500"}`} />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
