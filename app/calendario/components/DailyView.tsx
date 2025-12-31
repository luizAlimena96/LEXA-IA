import React, { useEffect, useRef } from "react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Event, BlockedSlot } from "@/app/types";

interface DailyViewProps {
    currentDate: Date;
    events: Event[];
    blockedSlots: BlockedSlot[];
    workingShifts?: Record<string, Array<{ start: string; end: string }>>;
    timeZone?: string;
    onEventClick: (event: Event) => void;
    onSlotClick: (date: Date, hour: number) => void;
}

const HOURS = Array.from({ length: 18 }, (_, i) => i + 5); // 06:00 to 23:00

export default function DailyView({
    currentDate,
    events,
    blockedSlots,
    workingShifts,
    timeZone,
    onEventClick,
    onSlotClick,
}: DailyViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const isWorkingHour = (hour: number) => {
        if (!workingShifts) return true;
        const dayName = format(currentDate, "EEEE", { locale: ptBR }).toLowerCase();
        const shifts = workingShifts[dayName];

        if (!shifts || shifts.length === 0) return false;

        return shifts.some((shift) => {
            const startH = parseInt(shift.start.split(":")[0]);
            const endH = parseInt(shift.end.split(":")[0]);
            return hour >= startH && hour < endH;
        });
    };

    const dayEvents = events.filter((event) => isSameDay(new Date(event.start), currentDate));
    const isToday = isSameDay(currentDate, new Date());

    const getEventStyle = (event: Event) => {
        const start = new Date(event.start);
        const end = new Date(event.end);

        const startMinutes = (start.getHours() * 60 + start.getMinutes()) - (5 * 60);
        const durationMinutes = (end.getTime() - start.getTime()) / 60000;

        const top = (startMinutes / 60) * 56; // 56px per hour for Day view (compact)
        const height = (durationMinutes / 60) * 56;

        return {
            top: `${top}px`,
            height: `${height}px`,
        };
    };

    return (
        <div className="flex flex-col h-[calc(100vh-280px)] overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative">
            {/* Header */}
            <div className="p-3 text-center border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm z-10">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                    {format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </h2>
                {isToday && <span className="text-indigo-600 font-medium text-xs">Hoje</span>}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative" ref={containerRef}>
                <div className="flex min-h-full">
                    {/* Time Column */}
                    <div className="w-16 flex-shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-700/50 bg-gray-50/30 dark:bg-gray-800/30">
                        {HOURS.map((hour) => (
                            <div
                                key={hour}
                                className="h-14 border-b border-gray-100 dark:border-gray-700/30 text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center font-medium relative"
                            >
                                <span className="-mt-14">{hour.toString().padStart(2, "0")}:00</span>
                            </div>
                        ))}
                    </div>

                    {/* Slots Column */}
                    <div className="flex-1 relative">
                        {HOURS.map((hour) => {
                            const isWorking = isWorkingHour(hour);
                            return (
                                <div
                                    key={hour}
                                    onClick={() => onSlotClick(currentDate, hour)}
                                    className={`h-14 border-b border-gray-100 dark:border-gray-800/50 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30 relative group 
                                   ${!isWorking ? 'bg-[url("/stripes.png")] bg-opacity-5' : ''}
                                   ${!isWorking ? 'bg-gray-50/50 dark:bg-[#0f111a]' : ''}
                               `}
                                >
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <span className="text-xs font-semibold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md shadow-sm">
                                            + Evento
                                        </span>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Events Overlay */}
                        {dayEvents.map((event) => {
                            const style = getEventStyle(event);
                            const isMeeting = event.type?.toLowerCase() === 'meeting';
                            return (
                                <div
                                    key={event.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEventClick(event);
                                    }}
                                    style={style}
                                    className={`absolute left-2 right-2 rounded-lg p-2.5 cursor-pointer shadow-sm hover:brightness-95 transition-all z-10 border-l-4 overflow-hidden
                                   ${isMeeting ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-500 text-blue-700 dark:text-blue-100' : 'bg-purple-100 dark:bg-purple-900/40 border-purple-500 text-purple-700 dark:text-purple-100'}
                               `}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="font-bold text-sm leading-tight">{event.title}</div>
                                            <div className="text-xs opacity-90 mt-0.5 flex items-center gap-1">
                                                <ClockIcon className="w-3 h-3" />
                                                {event.time} - {format(new Date(event.end), 'HH:mm')}
                                            </div>
                                        </div>
                                    </div>
                                    {event.leadName && (
                                        <div className="text-[10px] opacity-80 mt-1.5 flex items-center gap-1 bg-white/30 p-0.5 px-1.5 rounded w-fit">
                                            <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                            {event.leadName}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Current Time Line */}
                        {isToday && (
                            <div
                                className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none flex items-center"
                                style={{ top: `${((new Date().getHours() * 60 + new Date().getMinutes()) - (5 * 60)) / 60 * 56}px` }}
                            >
                                <div className="w-2.5 h-2.5 bg-red-500 rounded-full -ml-1.5" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ClockIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}
