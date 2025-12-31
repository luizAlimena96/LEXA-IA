import React from "react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Event, BlockedSlot } from "@/app/types";

interface WeeklyViewProps {
    currentDate: Date;
    events: Event[];
    blockedSlots: BlockedSlot[];
    workingShifts?: Record<string, Array<{ start: string; end: string }>>;
    timeZone?: string;
    onEventClick: (event: Event) => void;
    onSlotClick: (date: Date, hour: number) => void;
}

const HOURS = Array.from({ length: 19 }, (_, i) => i + 5); // 06:00 to 23:00
const DAYS = Array.from({ length: 7 }, (_, i) => i); // 0 to 6 (Sun to Sat)

export default function WeeklyView({
    currentDate,
    events,
    blockedSlots,
    workingShifts,
    timeZone,
    onEventClick,
    onSlotClick,
}: WeeklyViewProps) {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });

    const isWorkingHour = (dayIndex: number, hour: number) => {
        if (!workingShifts) return true;
        const dayName = format(addDays(weekStart, dayIndex), "EEEE", { locale: ptBR }).toLowerCase();
        const shifts = workingShifts[dayName];

        if (!shifts || shifts.length === 0) return false;

        return shifts.some((shift) => {
            const startH = parseInt(shift.start.split(":")[0]);
            const endH = parseInt(shift.end.split(":")[0]);
            return hour >= startH && hour < endH;
        });
    };

    const getDayEvents = (dayIndex: number) => {
        const date = addDays(weekStart, dayIndex);
        return events.filter((event) => isSameDay(new Date(event.start), date));
    };

    const getEventStyle = (event: Event) => {
        const start = new Date(event.start);
        const end = new Date(event.end);

        const startMinutes = (start.getHours() * 60 + start.getMinutes()) - (6 * 60);
        const durationMinutes = (end.getTime() - start.getTime()) / 60000;

        const top = (startMinutes / 60) * 48;
        const height = (durationMinutes / 60) * 48;

        return {
            top: `${top}px`,
            height: `${height}px`,
        };
    };

    return (
        <div className="flex flex-col h-[calc(100vh-280px)] overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative">
            <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm z-10">
                <div className="p-2 text-xs font-semibold text-gray-400 text-center border-r border-gray-200 dark:border-gray-700/50 flex items-center justify-center">
                    {timeZone}
                </div>
                {DAYS.map((dayIndex) => {
                    const date = addDays(weekStart, dayIndex);
                    const isToday = isSameDay(date, new Date());
                    return (
                        <div
                            key={dayIndex}
                            className={`p-2 text-center border-r border-gray-200 dark:border-gray-700/50 last:border-0 ${isToday ? "bg-indigo-50/30 dark:bg-indigo-900/10" : ""
                                }`}
                        >
                            <div
                                className={`text-[10px] uppercase mb-0.5 ${isToday ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400"
                                    }`}
                            >
                                {format(date, "EEE", { locale: ptBR })}
                            </div>
                            <div
                                className={`text-sm font-bold w-6 h-6 mx-auto flex items-center justify-center rounded-full ${isToday
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                                    : "text-gray-900 dark:text-white"
                                    }`}
                            >
                                {format(date, "d")}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Grid Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                <div className="grid grid-cols-8 min-h-full relative">
                    {/* Time Column */}
                    <div className="flex flex-col border-r border-gray-200 dark:border-gray-700/50 bg-gray-50/30 dark:bg-gray-800/30">
                        {HOURS.map((hour) => (
                            <div
                                key={hour}
                                className="h-12 border-b border-gray-100 dark:border-gray-700/30 text-[10px] text-gray-400 dark:text-gray-500 flex items-start justify-center pt-1 font-medium"
                            >
                                {hour.toString().padStart(2, "0")}:00
                            </div>
                        ))}
                    </div>

                    {/* Days Columns */}
                    {DAYS.map((dayIndex) => {
                        const dayDate = addDays(weekStart, dayIndex);
                        const dayEvents = getDayEvents(dayIndex);
                        const isToday = isSameDay(dayDate, new Date());

                        return (
                            <div key={dayIndex} className={`relative border-r border-gray-200 dark:border-gray-700/50 last:border-0 ${isToday ? 'bg-indigo-50/10 dark:bg-indigo-900/5' : ''}`}>
                                {/* Time Slots Background */}
                                {HOURS.map((hour) => {
                                    const isWorking = isWorkingHour(dayIndex, hour);
                                    return (
                                        <div
                                            key={hour}
                                            onClick={() => onSlotClick(dayDate, hour)}
                                            className={`h-12 border-b border-gray-100 dark:border-gray-800/50 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30 relative group 
                                    ${!isWorking ? 'bg-[url("/stripes.png")] bg-opacity-5' /* Add stripe pattern logic css later or just simple bg */ : ''}
                                    ${!isWorking ? 'bg-gray-50/50 dark:bg-[#0f111a]' : ''}
                                `}
                                        >
                                            {/* Add Button on Hover */}
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">
                                                    +
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
                                            className={`absolute left-1 right-1 rounded-md p-2 text-xs cursor-pointer shadow-sm hover:brightness-95 transition-all z-10 border-l-4 overflow-hidden
                                    ${isMeeting ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-500 text-blue-700 dark:text-blue-100' : 'bg-purple-100 dark:bg-purple-900/40 border-purple-500 text-purple-700 dark:text-purple-100'}
                                `}
                                        >
                                            <div className="font-semibold truncate leading-tight">
                                                {event.title}
                                            </div>
                                            <div className="text-[10px] opacity-90 truncate mt-0.5">
                                                {event.time} - {format(new Date(event.end), 'HH:mm')}
                                            </div>
                                            {event.leadName && (
                                                <div className="text-[10px] opacity-80 truncate mt-1 flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                                                    {event.leadName}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Current Time Indicator Line (if Today) */}
                                {isToday && (
                                    <div
                                        className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none flex items-center"
                                        style={{ top: `${((new Date().getHours() * 60 + new Date().getMinutes()) - (6 * 60)) / 60 * 48}px` }}
                                    >
                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full -ml-0.5" />
                                    </div>
                                )}

                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
