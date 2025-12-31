'use client';

import { Plus, X, Save, Clock, CalendarDays, AlertCircle } from 'lucide-react';
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
        <Modal isOpen={isOpen} onClose={onClose} title="Configurar Horários de Atendimento" size="lg">
            <div className="space-y-6">
                <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-lg flex gap-3 text-indigo-800 dark:text-indigo-200 text-sm">
                    <Clock className="w-5 h-5 shrink-0" />
                    <p>
                        Defina os intervalos em que você está disponível para atender.
                        O sistema só permitirá agendamentos dentro destes horários.
                    </p>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {DAYS_OF_WEEK.map((day) => {
                        const shifts = workingShifts[day.value] || [];
                        const hasShifts = shifts.length > 0;

                        return (
                            <div
                                key={day.value}
                                className={`
                                    border rounded-lg p-4 transition-all
                                    ${hasShifts
                                        ? "border-indigo-100 dark:border-indigo-900/30 bg-white dark:bg-gray-800/50"
                                        : "border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20"
                                    }
                                `}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <CalendarDays className={`w-4 h-4 ${hasShifts ? "text-indigo-500" : "text-gray-400"}`} />
                                        <h4 className={`font-medium ${hasShifts ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>
                                            {day.label}
                                        </h4>
                                    </div>
                                    {shifts.length < 4 && (
                                        <button
                                            onClick={() => onAddShift(day.value)}
                                            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-2 py-1 rounded transition-colors flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" />
                                            Adicionar Turno
                                        </button>
                                    )}
                                </div>

                                {shifts.length === 0 ? (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 pl-6 italic">
                                        Indisponível (Nenhum horário configurado)
                                    </p>
                                ) : (
                                    <div className="space-y-2 pl-6">
                                        {shifts.map((shift, index) => (
                                            <div key={index} className="flex items-center gap-2 group">
                                                <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 p-1.5 rounded-md border border-transparent group-hover:border-gray-200 dark:group-hover:border-gray-700 transition-colors">
                                                    <input
                                                        type="time"
                                                        value={shift.start}
                                                        onChange={(e) => onUpdateShift(day.value, index, 'start', e.target.value)}
                                                        className="bg-transparent border-none text-sm text-gray-700 dark:text-gray-200 focus:ring-0 p-0 w-20 text-center font-medium"
                                                    />
                                                    <span className="text-gray-400 text-xs">até</span>
                                                    <input
                                                        type="time"
                                                        value={shift.end}
                                                        onChange={(e) => onUpdateShift(day.value, index, 'end', e.target.value)}
                                                        className="bg-transparent border-none text-sm text-gray-700 dark:text-gray-200 focus:ring-0 p-0 w-20 text-center font-medium"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => onRemoveShift(day.value, index)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Remover turno"
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
                </div>

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
                        <Save className="w-4 h-4" />
                        Salvar Configurações
                    </button>
                </div>
            </div>
        </Modal>
    );
}
