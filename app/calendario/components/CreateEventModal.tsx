'use client';

import { Plus, Link as LinkIcon, Calendar, Clock, MapPin, Users, Type } from 'lucide-react';
import Modal from '@/app/components/Modal';
import DateTimeInput from '@/app/components/DateTimeInput';

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    formData: {
        title: string;
        date: string;
        time: string;
        duration: string;
        type: 'meeting' | 'call' | 'other';
        attendees: string;
        location: string;
        meetingLink: string;
    };
    setFormData: (data: any) => void;
}

export default function CreateEventModal({
    isOpen,
    onClose,
    onSave,
    formData,
    setFormData,
}: CreateEventModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Agendar Novo Evento" size="lg">
            <div className="space-y-6">
                {/* Título */}
                <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Título do Evento *
                    </label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Ex: Reunião de Alinhamento"
                        className="input-primary text-base w-full py-2.5"
                        autoFocus
                    />
                </div>

                <div className="space-y-8">
                    <div className="space-y-5">
                        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-semibold text-sm border-b border-indigo-100 dark:border-indigo-900/50 pb-2">
                            <Clock className="w-5 h-5" />
                            Horário e Definições
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                Data e Hora *
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <DateTimeInput
                                    type="date"
                                    value={formData.date}
                                    onChange={(value) => setFormData({ ...formData, date: value })}
                                />
                                <DateTimeInput
                                    type="time"
                                    value={formData.time}
                                    onChange={(value) => setFormData({ ...formData, time: value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                    Tipo
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                        className="input-primary pl-12 w-full py-2 appearance-none"
                                    >
                                        <option value="meeting">Reunião</option>
                                        <option value="call">Chamada</option>
                                        <option value="other">Outro</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                    Duração
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                        className="input-primary pl-12 w-full py-2 appearance-none"
                                    >
                                        <option value="30min">30 min</option>
                                        <option value="1h">1 hora</option>
                                        <option value="1h30">1h 30min</option>
                                        <option value="2h">2 horas</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-semibold text-sm border-b border-indigo-100 dark:border-indigo-900/50 pb-2">
                            <MapPin className="w-5 h-5" />
                            Localização e Pessoas
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                Link da Reunião
                            </label>
                            <div className="relative">
                                <input
                                    type="url"
                                    value={formData.meetingLink}
                                    onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                                    placeholder="https://meet.google.com/..."
                                    className="input-primary pl-12 w-full py-2.5"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                    Local Físico
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="Sala..."
                                        className="input-primary pl-12 w-full py-2.5"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                    Participantes
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={formData.attendees}
                                        onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                                        placeholder="Qtd"
                                        min="1"
                                        className="input-primary pl-12 w-full py-2.5"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-3 pt-6 border-t border-gray-100 dark:border-gray-800 mt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSave}
                        className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 shadow-sm hover:shadow"
                    >
                        <Plus className="w-5 h-5" />
                        Agendar Evento
                    </button>
                </div>
            </div>
        </Modal>
    );
}
