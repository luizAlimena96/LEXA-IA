'use client';

import { Clock, Users, MapPin, Video, Trash2 } from 'lucide-react';
import type { Event } from '@/app/types';

interface EventsListProps {
    events: Event[];
    selectedDate: Date | null;
    onClearSelection: () => void;
    onDeleteEvent?: (eventId: string) => void;
}

export default function EventsList({ events, selectedDate, onClearSelection, onDeleteEvent }: EventsListProps) {
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedDate
                        ? `Eventos de ${selectedDate.toLocaleDateString('pt-BR')}`
                        : "Próximos Eventos"
                    }
                </h3>
                {selectedDate && (
                    <button
                        onClick={onClearSelection}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                        Ver todos
                    </button>
                )}
            </div>

            <div className="space-y-4 max-h-[625px] overflow-y-auto pr-2">
                {filteredEvents.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                        Nenhum evento encontrado
                    </p>
                ) : (
                    filteredEvents.map((event) => (
                        <div
                            key={event.id}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-start space-x-3">
                                <div className={`w-1 h-full ${event.color} rounded-full`}></div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                                            {event.title}
                                        </h4>
                                        {onDeleteEvent && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(event.id, event.title);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 dark:text-red-400"
                                                title="Excluir evento"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                        <div className="flex items-center space-x-2">
                                            <Clock className="w-4 h-4" />
                                            <span>
                                                {event.date.toLocaleDateString("pt-BR")} às {event.time}
                                            </span>
                                        </div>

                                        {(event as any).leadPhone && (
                                            <div className="flex items-center space-x-2">
                                                <Users className="w-4 h-4" />
                                                <span className="font-medium">{(event as any).leadName || 'Lead'}: {(event as any).leadPhone}</span>
                                            </div>
                                        )}

                                        {event.attendees && !(event as any).leadPhone && (
                                            <div className="flex items-center space-x-2">
                                                <Users className="w-4 h-4" />
                                                <span>{event.attendees}</span>
                                            </div>
                                        )}

                                        {event.location && (
                                            <div className="flex items-center space-x-2">
                                                <MapPin className="w-4 h-4" />
                                                <span>{event.location}</span>
                                            </div>
                                        )}

                                        {event.leadName && (
                                            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
                                                <Users className="w-4 h-4" />
                                                <span title={event.leadPhone || ''}>
                                                    {event.leadName} {event.leadPhone && `(${event.leadPhone})`}
                                                </span>
                                            </div>
                                        )}

                                        {event.meetingLink && (
                                            <a
                                                href={event.meetingLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Video className="w-4 h-4" />
                                                <span className="truncate max-w-[200px]">Link da Reunião</span>
                                            </a>
                                        )}
                                    </div>

                                    {event.type === "call" && (
                                        <button className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors">
                                            <Video className="w-4 h-4" />
                                            <span>Entrar na Chamada</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

