'use client';

import { Pencil, Trash2, Calendar, Clock } from 'lucide-react';
import { AutoSchedulingConfig } from '../interfaces';

interface AutoSchedulingConfigListProps {
    configs: AutoSchedulingConfig[];
    onEdit: (config: AutoSchedulingConfig) => void;
    onDelete: (id: string) => void;
    searchTerm: string;
}

export default function AutoSchedulingConfigList({
    configs,
    onEdit,
    onDelete,
    searchTerm,
}: AutoSchedulingConfigListProps) {
    const filteredConfigs = configs.filter((config) =>
        config.crmStage?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredConfigs.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma configuração de agendamento encontrada</p>
                {searchTerm && <p className="text-sm mt-2">Tente ajustar sua busca</p>}
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            {filteredConfigs.map((config) => (
                <div
                    key={config.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: config.crmStage?.color || '#6366f1' }}
                                />
                                <h3 className="font-medium text-gray-900 dark:text-white">
                                    {config.crmStage?.name || 'Etapa não encontrada'}
                                </h3>
                                {!config.isActive && (
                                    <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                                        Inativo
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>Duração: {config.duration} min</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                        Antecedência: {config.minAdvanceHours}h
                                    </span>
                                </div>
                            </div>

                            {config.daysOfWeek && config.daysOfWeek.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {config.daysOfWeek
                                        .sort((a, b) => {
                                            const order: Record<string, number> = {
                                                'MON': 1, 'MONDAY': 1, 'SEG': 1,
                                                'TUE': 2, 'TUESDAY': 2, 'TER': 2,
                                                'WED': 3, 'WEDNESDAY': 3, 'QUA': 3,
                                                'THU': 4, 'THURSDAY': 4, 'QUI': 4,
                                                'FRI': 5, 'FRIDAY': 5, 'SEX': 5,
                                                'SAT': 6, 'SATURDAY': 6, 'SAB': 6, 'SÁB': 6,
                                                'SUN': 7, 'SUNDAY': 7, 'DOM': 7
                                            };
                                            const valA = order[a.toUpperCase()] || 99;
                                            const valB = order[b.toUpperCase()] || 99;
                                            return valA - valB;
                                        })
                                        .map((day) => {
                                            const dayMap: Record<string, string> = {
                                                'MON': 'Seg', 'MONDAY': 'Seg',
                                                'TUE': 'Ter', 'TUESDAY': 'Ter',
                                                'WED': 'Qua', 'WEDNESDAY': 'Qua',
                                                'THU': 'Qui', 'THURSDAY': 'Qui',
                                                'FRI': 'Sex', 'FRIDAY': 'Sex',
                                                'SAT': 'Sáb', 'SATURDAY': 'Sáb',
                                                'SUN': 'Dom', 'SUNDAY': 'Dom'
                                            };
                                            return (
                                                <span
                                                    key={day}
                                                    className="px-2 py-0.5 text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded"
                                                >
                                                    {dayMap[day.toUpperCase()] || day}
                                                </span>
                                            );
                                        })}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                            <button
                                onClick={() => onEdit(config)}
                                className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                title="Editar"
                            >
                                <Pencil className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => onDelete(config.id)}
                                className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                title="Excluir"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
