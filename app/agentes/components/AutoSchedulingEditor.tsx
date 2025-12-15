'use client';

import { useState, useEffect } from 'react';
import { Plus, Info, Calendar, Loader2 } from 'lucide-react';
import SearchInput from '../../components/SearchInput';
import { AutoSchedulingConfig, ReminderConfig, AutoSchedulingEditorProps, AutoSchedulingFormData } from './interfaces';
import AutoSchedulingConfigList from './auto-scheduling/AutoSchedulingConfigList';
import AutoSchedulingConfigForm from './auto-scheduling/AutoSchedulingConfigForm';
import AutoSchedulingReminderManager from './auto-scheduling/AutoSchedulingReminderManager';
import AutoSchedulingSlotTester from './auto-scheduling/AutoSchedulingSlotTester';
import api from '@/app/lib/api-client';

const DEFAULT_TEMPLATE = `Olá {{lead.name}}! 👋

Vamos agendar uma conversa?

Escolha um dos horários disponíveis:
{{available_slots}}

Responda com o número da opção que preferir!`;

const DEFAULT_CONFIRMATION = `Perfeito, {{lead.name}}! ✅

Seu agendamento está confirmado:
📅 Data: {{appointment.date}}
🕐 Horário: {{appointment.time}}
⏱️ Duração: {{appointment.duration}} minutos

Nos vemos em breve!`;

const DEFAULT_CANCELLATION = `Olá {{lead.name}},

Seu agendamento foi cancelado conforme solicitado.

Qualquer dúvida, estamos à disposição!`;

const DEFAULT_RESCHEDULING = `Olá {{lead.name}},

Seu agendamento foi reagendado para:

📅 Nova data: {{appointment.date}}
🕐 Novo horário: {{appointment.time}}

Confirme se está tudo ok!`;

export default function AutoSchedulingEditor({ agentId }: AutoSchedulingEditorProps) {
    const [configs, setConfigs] = useState<AutoSchedulingConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingConfig, setEditingConfig] = useState<AutoSchedulingConfig | null>(null);
    const [formData, setFormData] = useState<AutoSchedulingFormData>({
        crmStageId: '',
        duration: 60,
        minAdvanceHours: 2,
        preferredTime: 'any',
        daysOfWeek: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
        messageTemplate: DEFAULT_TEMPLATE,
        autoConfirm: false,
        moveToStageId: '',
        sendConfirmation: true,
        confirmationTemplate: DEFAULT_CONFIRMATION,
        notifyTeam: false,
        teamPhones: '',
        cancellationTemplate: DEFAULT_CANCELLATION,
        reschedulingTemplate: DEFAULT_RESCHEDULING,
    });

    const [reminders, setReminders] = useState<ReminderConfig[]>([]);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'general' | 'confirmation' | 'reminders' | 'cancellation'>('general');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadConfigs();
    }, [agentId]);

    useEffect(() => {
        if (editingConfig) {
            loadReminders();
        }
    }, [editingConfig]);

    const loadConfigs = async () => {
        try {
            setLoading(true);
            const data = await api.agents.autoScheduling.list(agentId);
            setConfigs(data);
        } catch (error) {
            console.error('Error loading configs:', error);
            showMessage('error', 'Não foi possível carregar as configurações');
        } finally {
            setLoading(false);
        }
    };

    const loadReminders = async () => {
        if (!editingConfig) return;

        try {
            const data = await api.agents.autoScheduling.reminders.list(agentId, editingConfig.id);
            setReminders(data);
        } catch (error) {
            console.error('Error loading reminders:', error);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleOpenModal = (config?: AutoSchedulingConfig) => {
        setEditingConfig(config || null);
        if (config) {
            setFormData({
                crmStageId: config.crmStageId,
                duration: config.duration,
                minAdvanceHours: config.minAdvanceHours,
                preferredTime: config.preferredTime || 'any',
                daysOfWeek: Array.isArray(config.daysOfWeek) ? config.daysOfWeek : [],
                messageTemplate: config.messageTemplate || DEFAULT_TEMPLATE,
                autoConfirm: config.autoConfirm || false,
                moveToStageId: config.moveToStageId || '',
                sendConfirmation: config.sendConfirmation ?? true,
                confirmationTemplate: config.confirmationTemplate || DEFAULT_CONFIRMATION,
                notifyTeam: config.notifyTeam || false,
                teamPhones: config.teamPhones?.join(',') || '',
                cancellationTemplate: config.cancellationTemplate || DEFAULT_CANCELLATION,
                reschedulingTemplate: config.reschedulingTemplate || DEFAULT_RESCHEDULING,
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingConfig(null);
        setActiveTab('general');
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            if (editingConfig) {
                await api.agents.autoScheduling.update(agentId, editingConfig.id, formData);
                showMessage('success', 'Configuração atualizada!');
            } else {
                await api.agents.autoScheduling.create(agentId, formData);
                showMessage('success', 'Configuração criada!');
            }
            handleCloseModal();
            loadConfigs();
        } catch (error) {
            console.error('Error saving config:', error);
            showMessage('error', 'Erro ao salvar configuração');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta configuração?')) return;

        try {
            await api.agents.autoScheduling.delete(agentId, id);
            showMessage('success', 'Configuração excluída!');
            loadConfigs();
        } catch (error) {
            console.error('Error deleting config:', error);
            showMessage('error', 'Erro ao excluir configuração');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Message Toast */}
            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'}`}>
                    <div className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        <span>{message.text}</span>
                    </div>
                </div>
            )}

            {/* Info Alert */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-2">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p className="font-medium mb-1">Agendamento Automático</p>
                        <p>
                            Configure agendamentos automáticos quando o lead entrar em uma etapa específica do CRM.
                            O sistema buscará horários disponíveis e enviará opções para o lead escolher.
                        </p>
                    </div>
                </div>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Configurações de Agendamento</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {configs.length} configuração{configs.length !== 1 ? 'ões' : ''} ativa{configs.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Nova Configuração
                </button>
            </div>

            {/* Search Bar */}
            <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Pesquisar configurações por etapa..."
                className="max-w-md"
            />

            {/* Configs List */}
            <AutoSchedulingConfigList
                configs={configs}
                onEdit={handleOpenModal}
                onDelete={handleDelete}
                searchTerm={searchTerm}
            />

            {/* Modal */}
            {showModal && (
                <AutoSchedulingConfigForm
                    formData={formData}
                    setFormData={setFormData}
                    onSave={handleSave}
                    onCancel={handleCloseModal}
                    saving={saving}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    agentId={agentId}
                    editingConfig={editingConfig}
                />
            )}
        </div>
    );
}
