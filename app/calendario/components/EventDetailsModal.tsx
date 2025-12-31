'use client';

import { X, Calendar, Clock, MapPin, Video, Users, Trash2 } from 'lucide-react';
import Modal from '@/app/components/Modal';
import type { Event } from '@/app/types';

interface EventDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: Event | null;
    onDelete?: (eventId: string) => void;
}

export default function EventDetailsModal({
    isOpen,
    onClose,
    event,
    onDelete,
}: EventDetailsModalProps) {
    if (!event) return null;

    const handleDelete = () => {
        if (onDelete && confirm("Tem certeza que deseja excluir este evento?")) {
            onDelete(event.id);
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Detalhes do Evento" size="md">
            <div className="space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                            {event.title}
                        </h2>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${event.type === 'meeting' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                            event.type === 'call' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                            {event.type === 'meeting' ? 'Reunião' : event.type === 'call' ? 'Chamada' : 'Outro'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Data e Hora</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {event.date?.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {event.time} ({event.duration})
                            </p>
                        </div>
                    </div>

                    {(event.leadName || event.leadPhone) && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <Users className="w-5 h-5 text-gray-500 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Participante</p>
                                {event.leadName && (
                                    <p className="text-sm text-gray-900 dark:text-white font-medium">{event.leadName}</p>
                                )}
                                {event.leadPhone && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{event.leadPhone}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {event.location && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Local</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{event.location}</p>
                            </div>
                        </div>
                    )}

                    {event.meetingLink && (
                        <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
                            <Video className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Link da Reunião</p>
                                <a
                                    href={event.meetingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                                >
                                    {event.meetingLink}
                                </a>
                            </div>
                        </div>
                    )}

                    {event.description && (
                        <div className="mt-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Observações</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                {event.description}
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {onDelete && (
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium"
                        >
                            <Trash2 className="w-4 h-4" />
                            Excluir Evento
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </Modal>
    );
}
