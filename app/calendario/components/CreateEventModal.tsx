'use client';

import { Plus, Link as LinkIcon } from 'lucide-react';
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
        <Modal isOpen={isOpen} onClose={onClose} title="Criar Novo Evento" size="lg">
            <div className="space-y-4">
                {/* Título */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Título do Evento *
                    </label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Ex: Reunião com Cliente"
                        className="input-primary"
                    />
                </div>

                {/* Data e Hora */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Data *
                        </label>
                        <DateTimeInput
                            type="date"
                            value={formData.date}
                            onChange={(value) => setFormData({ ...formData, date: value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Horário *
                        </label>
                        <DateTimeInput
                            type="time"
                            value={formData.time}
                            onChange={(value) => setFormData({ ...formData, time: value })}
                        />
                    </div>
                </div>

                {/* Tipo e Duração */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tipo
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                            className="input-primary"
                        >
                            <option value="meeting">Reunião</option>
                            <option value="call">Chamada</option>
                            <option value="other">Evento</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Duração
                        </label>
                        <select
                            value={formData.duration}
                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                            className="input-primary"
                        >
                            <option value="30min">30 minutos</option>
                            <option value="1h">1 hora</option>
                            <option value="1h30">1 hora e 30 min</option>
                            <option value="2h">2 horas</option>
                            <option value="3h">3 horas</option>
                        </select>
                    </div>
                </div>

                {/* Participantes e Local */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Número de Participantes
                        </label>
                        <input
                            type="number"
                            value={formData.attendees}
                            onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                            placeholder="Ex: 5"
                            min="1"
                            className="input-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Local
                        </label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="Ex: Sala 3"
                            className="input-primary"
                        />
                    </div>
                </div>

                {/* Link da Reunião */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                        Link da Reunião
                    </label>
                    <input
                        type="url"
                        value={formData.meetingLink}
                        onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                        placeholder="https://meet.google.com/xxx-xxxx-xxx"
                        className="input-primary"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Cole o link do Google Meet, Zoom, Teams, etc.
                    </p>
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSave}
                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Criar Evento
                    </button>
                </div>
            </div>
        </Modal>
    );
}
