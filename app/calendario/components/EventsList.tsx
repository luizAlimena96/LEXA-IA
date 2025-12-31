'use client';

import { Clock, Users, MapPin, Video, Trash2 } from 'lucide-react';
import type { Event } from '@/app/types';

interface EventsListProps {
    events: Event[];
    selectedDate: Date | null;
    onClearSelection: () => void;
    onDeleteEvent?: (eventId: string) => void;
    onEventClick?: (event: Event) => void;
}

export default function EventsList({ events, selectedDate, onClearSelection, onDeleteEvent, onEventClick }: EventsListProps) {
    const filteredEvents = selectedDate
        ? events.filter(e =>
            e.date.getDate() === selectedDate.getDate() &&
            e.date.getMonth() === selectedDate.getMonth() &&
            e.date.getFullYear() === selectedDate.getFullYear()
        )
        : events;

    const handleDelete = (eventId: string, eventTitle: string) => {
        if (confirm(`Deseja realmente excluir o evento "${eventTitle}"?`)) {
            onDeleteEvent?.(eventId);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                    {selectedDate
                        ? `Eventos de ${selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`
                        : "Próximos Eventos"
                    }
                </h3>
                {selectedDate && (
                    <button
                        onClick={onClearSelection}
                        className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        Limpar filtro
                    </button>
                )}
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                {filteredEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <Clock className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-sm">Nenhum evento</p>
                    </div>
                ) : (
                    filteredEvents.map((event) => (
                        <div
                            key={event.id}
                            onClick={() => onEventClick?.(event)}
                            className="group relative border border-gray-100 dark:border-gray-800 rounded-xl p-4 hover:border-gray-200 dark:hover:border-gray-700 transition-all bg-gray-50/50 dark:bg-gray-800/20 cursor-pointer hover:shadow-sm"
                        >
                            <div className="flex gap-3">
                                <div className={`w-1 rounded-full ${event.color || 'bg-gray-300'}`}></div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-medium text-gray-900 dark:text-white truncate pr-6">
                                            {event.title}
                                        </h4>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                            <span>
                                                {event.time}
                                            </span>
                                            {event.location && (
                                                <>
                                                    <span>•</span>
                                                    <span className="truncate">{event.location}</span>
                                                </>
                                            )}
                                        </div>

                                        {(event as any).leadName && (
                                            <div className="text-xs text-gray-500 flex items-center gap-1.5 pt-1">
                                                <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold">
                                                    {(event as any).leadName?.[0]}
                                                </div>
                                                <span className="truncate">{(event as any).leadName}</span>
                                            </div>
                                        )}

                                        {event.meetingLink && (
                                            <a
                                                href={event.meetingLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Video className="w-3 h-3" />
                                                Entrar na reunião
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {onDeleteEvent && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(event.id, event.title);
                                    }}
                                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

