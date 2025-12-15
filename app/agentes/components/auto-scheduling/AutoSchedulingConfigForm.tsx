'use client';

import { useState } from 'react';
import { X, Calendar, Clock, Bell, MessageSquare } from 'lucide-react';
import CRMStageSelector from '@/app/components/CRMStageSelector';
import { AutoSchedulingConfig, AutoSchedulingFormData } from '../interfaces';

const DAYS_OF_WEEK = [
    { value: 'MON', label: 'Seg' },
    { value: 'TUE', label: 'Ter' },
    { value: 'WED', label: 'Qua' },
    { value: 'THU', label: 'Qui' },
    { value: 'FRI', label: 'Sex' },
    { value: 'SAT', label: 'Sáb' },
    { value: 'SUN', label: 'Dom' },
];

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
    const toggleDay = (day: string) => {
        setFormData((prev) => ({
            ...prev,
            daysOfWeek: prev.daysOfWeek.includes(day)
                ? prev.daysOfWeek.filter((d) => d !== day)
                : [...prev.daysOfWeek, day],
        }));
    };

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
                    {[
                        { id: 'general', label: 'Geral', icon: Calendar },
                        { id: 'confirmation', label: 'Confirmação', icon: MessageSquare },
                        { id: 'reminders', label: 'Lembretes', icon: Bell },
                        { id: 'cancellation', label: 'Cancelamento', icon: X },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            <span className="font-medium">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            {/* CRM Stage */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Etapa do CRM *
                                </label>
                                <CRMStageSelector
                                    agentId={agentId}
                                    value={formData.crmStageId || ''}
                                    onChange={(value) => setFormData({ ...formData, crmStageId: value })}
                                />
                            </div>

                            {/* Duration and Advance Hours */}
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

                            {/* Days of Week */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Dias da Semana *
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {DAYS_OF_WEEK.map((day) => (
                                        <button
                                            key={day.value}
                                            type="button"
                                            onClick={() => toggleDay(day.value)}
                                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${formData.daysOfWeek.includes(day.value)
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                }`}
                                        >
                                            {day.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Message Template */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Mensagem de Agendamento
                                </label>
                                <textarea
                                    value={formData.messageTemplate}
                                    onChange={(e) => setFormData({ ...formData, messageTemplate: e.target.value })}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Olá {{lead.name}}! Vamos agendar?"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'confirmation' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={formData.sendConfirmation}
                                    onChange={(e) => setFormData({ ...formData, sendConfirmation: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Enviar mensagem de confirmação
                                </label>
                            </div>

                            {formData.sendConfirmation && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Mensagem de Confirmação
                                    </label>
                                    <textarea
                                        value={formData.confirmationTemplate}
                                        onChange={(e) => setFormData({ ...formData, confirmationTemplate: e.target.value })}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'cancellation' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Mensagem de Cancelamento
                                </label>
                                <textarea
                                    value={formData.cancellationTemplate}
                                    onChange={(e) => setFormData({ ...formData, cancellationTemplate: e.target.value })}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Mensagem de Reagendamento
                                </label>
                                <textarea
                                    value={formData.reschedulingTemplate}
                                    onChange={(e) => setFormData({ ...formData, reschedulingTemplate: e.target.value })}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
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
