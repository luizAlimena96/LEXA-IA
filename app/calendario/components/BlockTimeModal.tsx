'use client';

import { Save } from 'lucide-react';
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
}: BlockTimeModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Bloquear Horário Específico">
            <div className="space-y-4">
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

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Início *
                        </label>
                        <DateTimeInput
                            type="time"
                            value={formData.startTime}
                            onChange={(value) => setFormData({ ...formData, startTime: value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Fim *
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
                        Título (opcional)
                    </label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Ex: Almoço, Reunião interna..."
                        className="input-primary"
                    />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSave}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Bloquear Horário
                    </button>
                </div>
            </div>
        </Modal>
    );
}
