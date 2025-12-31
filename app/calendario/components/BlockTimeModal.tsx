'use client';

import { Save, Calendar, Clock, AlertCircle } from 'lucide-react';
import Modal from '@/app/components/Modal';
import DateTimeInput from '@/app/components/DateTimeInput';

interface BlockTimeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    formData: {
        date: string;
        startTime: string;
        endTime: string;
        title: string;
    };
    setFormData: (data: any) => void;
}

export default function BlockTimeModal({
    isOpen,
    onClose,
    onSave,
    formData,
    setFormData,
    onBlockDay
}: BlockTimeModalProps & { onBlockDay?: () => void }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Bloquear Horário" size="md">
            <div className="space-y-6">
                <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg flex gap-3 text-red-800 dark:text-red-200 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>
                        Este período ficará indisponível para novos agendamentos. Clientes não poderão marcar horários neste intervalo.
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            Data do Bloqueio
                        </label>
                        <DateTimeInput
                            type="date"
                            value={formData.date}
                            onChange={(value) => setFormData({ ...formData, date: value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                Início
                            </label>
                            <DateTimeInput
                                type="time"
                                value={formData.startTime}
                                onChange={(value) => setFormData({ ...formData, startTime: value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                Fim
                            </label>
                            <DateTimeInput
                                type="time"
                                value={formData.endTime}
                                onChange={(value) => setFormData({ ...formData, endTime: value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Motivo (Interno)
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Ex: Almoço, Reunião interna..."
                            className="input-primary"
                        />
                    </div>
                </div>

                <div className="flex gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSave}
                        className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 shadow-sm hover:shadow"
                    >
                        <Save className="w-4 h-4" />
                        Confirmar Bloqueio
                    </button>
                </div>
            </div>
        </Modal>
    );
}
