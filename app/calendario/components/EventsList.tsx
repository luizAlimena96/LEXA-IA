'use client';

import { Clock, Users, MapPin, Video } from 'lucide-react';
import type { Event } from '@/app/types';

interface EventsListProps {
    events: Event[];
    selectedDate: Date | null;
    onClearSelection: () => void;
}

export default function EventsList({ events, selectedDate, onClearSelection }: EventsListProps) {
    const filteredEvents = selectedDate
        ? events.filter(e =>
            e.date.getDate() === selectedDate.getDate() &&
            e.date.getMonth() === selectedDate.getMonth() &&
            e.date.getFullYear() === selectedDate.getFullYear()
        )
        : events;

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
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        >
                            <div className="flex items-start space-x-3">
                                <div className={`w-1 h-full ${event.color} rounded-full`}></div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                                        {event.title}
                                    </h4>

                                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                        <div className="flex items-center space-x-2">
                                            <Clock className="w-4 h-4" />
                                            <span>
                                                {event.date.toLocaleDateString("pt-BR")} às {event.time}
                                            </span>
                                        </div>

                                        {event.attendees && (
                                            <div className="flex items-center space-x-2">
                                                <Users className="w-4 h-4" />
                                                <span>{event.attendees} participantes</span>
                                            </div>
                                        )}

                                        {event.location && (
                                            <div className="flex items-center space-x-2">
                                                <MapPin className="w-4 h-4" />
                                                <span>{event.location}</span>
                                            </div>
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
