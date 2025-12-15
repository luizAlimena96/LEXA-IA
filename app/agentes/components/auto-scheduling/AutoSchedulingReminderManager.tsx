'use client';

import { Plus, Trash2, Pencil, Bell, Users } from 'lucide-react';
import { ReminderConfig } from '../interfaces';
import api from '@/app/lib/api-client';

interface AutoSchedulingReminderManagerProps {
    agentId: string;
    configId: string;
    reminders: ReminderConfig[];
    onRefresh: () => void;
    showMessage: (type: 'success' | 'error', text: string) => void;
}

export default function AutoSchedulingReminderManager({
    agentId,
    configId,
    reminders,
    onRefresh,
    showMessage,
}: AutoSchedulingReminderManagerProps) {
    const handleDelete = async (reminderId: string) => {
        if (!confirm('Tem certeza que deseja excluir este lembrete?')) return;

        try {
            await api.agents.autoScheduling.reminders.delete(agentId, configId, reminderId);
            showMessage('success', 'Lembrete excluído!');
            onRefresh();
        } catch (error) {
            console.error('Error deleting reminder:', error);
            showMessage('error', 'Erro ao excluir lembrete');
        }
    };

    const formatMinutes = (minutes: number) => {
        if (minutes < 60) return `${minutes} minutos`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 dark:text-white">
                    Lembretes Configurados
                </h4>
            </div>

            {reminders.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum lembrete configurado</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {reminders.map((reminder) => (
                        <div
                            key={reminder.id}
                            className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Bell className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {formatMinutes(reminder.minutesBefore)} antes
                                        </span>
                                    </div>

                                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                        {reminder.sendToLead && (
                                            <p>✓ Enviar para o lead</p>
                                        )}
                                        {reminder.sendToTeam && (
                                            <p className="flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                Enviar para a equipe
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDelete(reminder.id)}
                                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                    title="Excluir"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
