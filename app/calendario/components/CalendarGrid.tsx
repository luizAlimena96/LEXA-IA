'use client';

import { Ban } from 'lucide-react';
import type { Event, BlockedSlot } from '@/app/types';

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
            (event) => {
                const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
                return eventDate.getDate() === date.getDate() &&
                    eventDate.getMonth() === date.getMonth() &&
                    eventDate.getFullYear() === date.getFullYear();
            }
        );
    };

    const isDayBlocked = (date: Date | null) => {
        if (!date) return false;
        return blockedSlots.some(slot => {
            const slotDate = new Date(slot.startTime);
            return slot.allDay &&
                slotDate.getDate() === date.getDate() &&
                slotDate.getMonth() === date.getMonth() &&
                slotDate.getFullYear() === date.getFullYear();
        });
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
                        <div key={index} className="relative group aspect-square">
                            <button
                                onClick={() => day && onDateSelect(day)}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    if (day) onBlockDay(day);
                                }}
                                className={`
                                    w-full h-full rounded-xl transition-all relative flex flex-col items-center justify-center gap-1
                                    ${!day ? "invisible" : ""}
                                    ${isBlocked ? "bg-gray-50 dark:bg-gray-800/30 opacity-60 cursor-not-allowed" : ""}
                                    ${isToday && !isBlocked ? "bg-indigo-600 text-white shadow-sm" : ""}
                                    ${!isToday && !isBlocked && day ? "hover:bg-gray-50 dark:hover:bg-gray-800" : ""}
                                    ${selectedDate?.getDate() === day?.getDate() &&
                                        selectedDate?.getMonth() === day?.getMonth() &&
                                        !isToday && !isBlocked
                                        ? "ring-1 ring-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                                        : ""
                                    }
                                `}
                            >
                                {day && (
                                    <>
                                        <span
                                            className={`text-sm font-medium ${isToday
                                                ? "text-white"
                                                : isBlocked
                                                    ? "text-gray-400 dark:text-gray-600"
                                                    : "text-gray-700 dark:text-gray-300"
                                                }`}
                                        >
                                            {day.getDate()}
                                        </span>

                                        {hasEvents && !isBlocked && (
                                            <div className="flex gap-0.5">
                                                {dayEvents.slice(0, 3).map((event, i) => (
                                                    <div
                                                        key={event.id}
                                                        className={`w-1 h-1 rounded-full ${isToday ? 'bg-white/70' : event.color?.replace('bg-', 'bg-') || 'bg-gray-400'}`}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {isBlocked && (
                                            <Ban className="w-3 h-3 text-gray-300 dark:text-gray-700" />
                                        )}
                                    </>
                                )}
                            </button>
                            {day && (
                                <button
                                    onClick={() => onBlockDay(day)}
                                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                                    title={isBlocked ? "Desbloquear dia" : "Bloquear dia"}
                                >
                                    <Ban className={`w-3 h-3 ${isBlocked ? "text-gray-400" : "text-gray-300"}`} />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
