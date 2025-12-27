'use client';

import { useState } from 'react';
import { X, Calendar, Clock, Bell, MessageSquare, Users } from 'lucide-react';
import CRMStageSelector from '@/app/components/CRMStageSelector';
import { AutoSchedulingConfig, AutoSchedulingFormData } from '../interfaces';

interface AutoSchedulingConfigFormProps {
    formData: AutoSchedulingFormData;
    setFormData: (data: AutoSchedulingFormData | ((prev: AutoSchedulingFormData) => AutoSchedulingFormData)) => void;
    onSave: () => void;
    onCancel: () => void;
    saving: boolean;
    activeTab: 'general' | 'confirmation' | 'reminders' | 'cancellation';
    setActiveTab: (tab: 'general' | 'confirmation' | 'reminders' | 'cancellation') => void;
    agentId: string;
    editingConfig: AutoSchedulingConfig | null;
}

export default function AutoSchedulingConfigForm({
    formData,
    setFormData,
    onSave,
    onCancel,
    saving,
    activeTab,
    setActiveTab,
    agentId,
    editingConfig,
}: AutoSchedulingConfigFormProps) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {editingConfig ? 'Editar' : 'Nova'} Configuração de Agendamento
                    </h2>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'general'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        Geral
                    </button>
                    <button
                        onClick={() => setActiveTab('reminders')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'reminders'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        Lembretes
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {activeTab === 'general' ? (
                        <div className="space-y-6">
                            <div>
                                <CRMStageSelector
                                    agentId={agentId}
                                    value={formData.crmStageId || ''}
                                    onChange={(value) => setFormData({ ...formData, crmStageId: value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Duração (minutos) *
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        min="15"
                                        step="15"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Antecedência Mínima (horas) *
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.minAdvanceHours}
                                        onChange={(e) => setFormData({ ...formData, minAdvanceHours: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        min="1"
                                    />
                                </div>
                            </div>

                            {/* Note about calendar configuration */}
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                                            Configuração de Horários
                                        </p>
                                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                            Os dias e horários disponíveis para agendamento são configurados no <strong>Calendário</strong>.
                                            A IA buscará automaticamente o primeiro horário livre respeitando suas regras.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Team Notification Config */}
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Users className="h-4 w-4" /> Notificação da Equipe
                                </h3>
                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.notifyTeam}
                                            onChange={(e) => {
                                                const newNotifyTeam = e.target.checked;
                                                const updatedReminders = (formData.reminders || []).map(r => ({
                                                    ...r,
                                                    sendToTeam: newNotifyTeam
                                                }));
                                                setFormData({ ...formData, notifyTeam: newNotifyTeam, reminders: updatedReminders });
                                            }}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Notificar equipe sobre agendamentos (Global)</span>
                                    </label>

                                    {formData.notifyTeam && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                                    Telefones da Equipe (separados por vírgula)
                                                </label>
                                                <input
                                                    value={formData.teamPhones}
                                                    onChange={(e) => setFormData({ ...formData, teamPhones: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    placeholder="Ex: 5511999999999, 5511888888888"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                                    Mensagem Padrão para Equipe
                                                </label>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                                                    Esta mensagem será enviada para a equipe em todos os horários de lembrete configurados abaixo.
                                                </p>
                                                <input
                                                    value={formData.reminders?.[0]?.teamMessageTemplate || "Lembrete: Reunião com {{lead.name}} às {{appointment.time}}."}
                                                    onChange={(e) => {
                                                        const newTemplate = e.target.value;
                                                        const updatedReminders = (formData.reminders || []).map(r => ({
                                                            ...r,
                                                            teamMessageTemplate: newTemplate
                                                        }));
                                                        setFormData({ ...formData, reminders: updatedReminders });
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    placeholder="Ex: Lembrete: Reunião com {{lead.name}} às {{appointment.time}}."
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Window Config */}
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Clock className="h-4 w-4" /> Janela de Envio de Lembretes
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                                    Defina o horário permitido para envio de lembretes. Lembretes agendados para a madrugada serão segurados até o início da janela.
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Inicio (Ex: 08:00)</label>
                                        <input
                                            type="time"
                                            value={formData.reminderWindowStart}
                                            onChange={(e) => setFormData({ ...formData, reminderWindowStart: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Fim (Ex: 22:00)</label>
                                        <input
                                            type="time"
                                            value={formData.reminderWindowEnd}
                                            onChange={(e) => setFormData({ ...formData, reminderWindowEnd: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Reminders List */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                        <Bell className="h-4 w-4" /> Lista de Lembretes
                                    </h3>
                                    <button
                                        onClick={() => {
                                            const globalTeamTemplate = formData.reminders?.[0]?.teamMessageTemplate || "Lembrete: Reunião com {{lead.name}} às {{appointment.time}}.";

                                            const newReminder: any = {
                                                minutesBefore: 60,
                                                sendToLead: true,
                                                sendToTeam: formData.notifyTeam,
                                                additionalPhones: [],
                                                leadMessageTemplate: "Olá {{lead.name}}, lembrete da reunião às {{appointment.time}}.",
                                                teamMessageTemplate: globalTeamTemplate,
                                                isActive: true
                                            };
                                            setFormData({
                                                ...formData,
                                                reminders: [...(formData.reminders || []), newReminder]
                                            });
                                        }}
                                        className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700"
                                    >
                                        + Adicionar Lembrete
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {(!formData.reminders || formData.reminders.length === 0) && (
                                        <p className="text-center text-sm text-gray-500 py-4">Nenhum lembrete configurado.</p>
                                    )}

                                    {formData.reminders && formData.reminders.map((reminder, idx) => (
                                        <div key={idx} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                                                        {reminder.minutesBefore >= 60 ? `${(reminder.minutesBefore / 60).toFixed(1).replace('.0', '')} horas antes` : `${reminder.minutesBefore} minutos antes`}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const newList = [...formData.reminders];
                                                        newList.splice(idx, 1);
                                                        setFormData({ ...formData, reminders: newList });
                                                    }}
                                                    className="text-red-500 hover:bg-red-50 p-1 rounded"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 mb-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Minutos antes</label>
                                                    <input
                                                        type="number"
                                                        value={reminder.minutesBefore}
                                                        onChange={(e) => {
                                                            const newList = [...formData.reminders];
                                                            newList[idx].minutesBefore = parseInt(e.target.value);
                                                            setFormData({ ...formData, reminders: newList });
                                                        }}
                                                        className="w-full text-sm border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                    />
                                                </div>
                                            </div>

                                            <div className="mb-2">
                                                <label className="block text-xs text-gray-500 mb-1">Mensagem Lead</label>
                                                <input
                                                    value={reminder.leadMessageTemplate}
                                                    onChange={(e) => {
                                                        const newList = [...formData.reminders];
                                                        newList[idx].leadMessageTemplate = e.target.value;
                                                        setFormData({ ...formData, reminders: newList });
                                                    }}
                                                    className="w-full text-sm border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                    placeholder="Ex: Olá {{lead.name}}, lembrete..."
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSave}
                        disabled={saving || !formData.crmStageId}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                    >
                        {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
