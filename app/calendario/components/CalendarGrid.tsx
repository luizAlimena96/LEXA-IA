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
                        <div key={index} className="relative group h-28 xl:h-32">
                            <button
                                onClick={() => day && onDateSelect(day)}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    if (day) onBlockDay(day);
                                }}
                                className={`
                                w-full h-full rounded-xl transition-all relative flex flex-col items-center justify-start gap-1 p-1
                                ${!day ? "invisible" : ""}
                                ${isBlocked
                                        ? "bg-gray-50 dark:bg-[#0f111a] cursor-not-allowed bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.03)_10px,rgba(0,0,0,0.03)_20px)] dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.02)_10px,rgba(255,255,255,0.02)_20px)]"
                                        : ""
                                    }
                                ${isToday && !isBlocked ? "bg-indigo-600 text-white shadow-sm" : ""}
                                ${!isToday && !isBlocked && day ? "bg-white dark:bg-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 border border-transparent shadow-sm hover:shadow-md" : ""}
                                ${selectedDate?.getDate() === day?.getDate() &&
                                        selectedDate?.getMonth() === day?.getMonth() &&
                                        !isToday && !isBlocked
                                        ? "ring-2 ring-indigo-600 ring-offset-2 dark:ring-offset-gray-900 bg-indigo-50 dark:bg-indigo-900/20"
                                        : ""
                                    }
                                `}
                            >
                                {day && (
                                    <>
                                        <span
                                            className={`absolute top-2 left-2 text-xs font-medium ${isToday
                                                ? "text-white"
                                                : isBlocked
                                                    ? "text-gray-400 dark:text-gray-600"
                                                    : "text-gray-700 dark:text-gray-300"
                                                }`}
                                        >
                                            {day.getDate()}
                                        </span>

                                        {hasEvents && !isBlocked && (
                                            <div className="flex flex-col gap-1 mt-6 w-full px-1">
                                                {dayEvents.slice(0, 3).map((event, i) => (
                                                    <div
                                                        key={event.id}
                                                        className={`text-[10px] px-1.5 py-0.5 rounded truncate w-full ${(event.type?.toLowerCase() || 'meeting') === 'meeting'
                                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                                                            }`}
                                                    >
                                                        {event.title}
                                                    </div>
                                                ))}
                                                {dayEvents.length > 3 && (
                                                    <span className="text-[10px] text-gray-400 pl-1">
                                                        +{dayEvents.length - 3} mais
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {isBlocked && (
                                            <Ban className="w-3 h-3 text-gray-300 dark:text-gray-700" />
                                        )}
                                    </>
                                )}
                            </button>
                            {
                                day && (
                                    <button
                                        onClick={() => onBlockDay(day)}
                                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                                        title={isBlocked ? "Desbloquear dia" : "Bloquear dia"}
                                    >
                                        <Ban className={`w-3 h-3 ${isBlocked ? "text-gray-400" : "text-gray-300"}`} />
                                    </button>
                                )
                            }
                        </div>
                    );
                })}
            </div>
        </div >
    );
}
