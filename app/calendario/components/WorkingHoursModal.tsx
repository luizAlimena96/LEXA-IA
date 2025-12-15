'use client';

import { Plus, X, Save } from 'lucide-react';
import Modal from '@/app/components/Modal';

interface WorkingHoursModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    workingShifts: Record<string, Array<{ start: string; end: string }>>;
    onAddShift: (day: string) => void;
    onRemoveShift: (day: string, index: number) => void;
    onUpdateShift: (day: string, index: number, field: 'start' | 'end', value: string) => void;
}

const DAYS_OF_WEEK = [
    { value: 'monday', label: 'Segunda-feira' },
    { value: 'tuesday', label: 'Terça-feira' },
    { value: 'wednesday', label: 'Quarta-feira' },
    { value: 'thursday', label: 'Quinta-feira' },
    { value: 'friday', label: 'Sexta-feira' },
    { value: 'saturday', label: 'Sábado' },
    { value: 'sunday', label: 'Domingo' },
];

export default function WorkingHoursModal({
    isOpen,
    onClose,
    onSave,
    workingShifts,
    onAddShift,
    onRemoveShift,
    onUpdateShift,
}: WorkingHoursModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Horários de Atendimento" size="lg">
            <div className="space-y-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Configure os horários em que você está disponível para agendamentos.
                    Você pode adicionar até 4 turnos por dia.
                </p>

                {DAYS_OF_WEEK.map((day) => {
                    const shifts = workingShifts[day.value] || [];
                    return (
                        <div key={day.value} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                    {day.label}
                                </h4>
                                {shifts.length < 4 && (
                                    <button
                                        onClick={() => onAddShift(day.value)}
                                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Adicionar Turno
                                    </button>
                                )}
                            </div>

                            {shifts.length === 0 ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Nenhum turno configurado
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {shifts.map((shift, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <input
                                                type="time"
                                                value={shift.start}
                                                onChange={(e) => onUpdateShift(day.value, index, 'start', e.target.value)}
                                                className="input-primary flex-1"
                                            />
                                            <span className="text-gray-500 dark:text-gray-400">até</span>
                                            <input
                                                type="time"
                                                value={shift.end}
                                                onChange={(e) => onUpdateShift(day.value, index, 'end', e.target.value)}
                                                className="input-primary flex-1"
                                            />
                                            <button
                                                onClick={() => onRemoveShift(day.value, index)}
                                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}

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
                        <Save className="w-4 h-4" />
                        Salvar Horários
                    </button>
                </div>
            </div>
        </Modal>
    );
}
