'use client';

import { useState, useEffect } from 'react';
import { Plus, Info, Calendar, Loader2 } from 'lucide-react';
import SearchInput from '@/app/components/SearchInput';
import { AutoSchedulingConfig, ReminderConfig, AutoSchedulingEditorProps, AutoSchedulingFormData } from '@/app/agentes/components/interfaces';
import AutoSchedulingConfigList from '@/app/agentes/components/auto-scheduling/AutoSchedulingConfigList';
import AutoSchedulingConfigForm from '@/app/agentes/components/auto-scheduling/AutoSchedulingConfigForm';
import AutoSchedulingReminderManager from '@/app/agentes/components/auto-scheduling/AutoSchedulingReminderManager';
import AutoSchedulingSlotTester from '@/app/agentes/components/auto-scheduling/AutoSchedulingSlotTester';
import api from '@/app/lib/api-client';

interface TemplateAutoSchedulingEditorProps {
    templateId: string;
    onUpdate: () => void;
}

export default function TemplateAutoSchedulingEditor({ templateId, onUpdate }: TemplateAutoSchedulingEditorProps) {
    const [configs, setConfigs] = useState<AutoSchedulingConfig[]>([]);
    const [agent, setAgent] = useState<any>(null); // Store agent details for validation
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingConfig, setEditingConfig] = useState<AutoSchedulingConfig | null>(null);
    const [formData, setFormData] = useState<AutoSchedulingFormData>({
        crmStageId: '',
        duration: 60,
        minAdvanceHours: 2,
        preferredTime: 'any',
        daysOfWeek: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
        messageTemplate: '',
        autoConfirm: false,
        moveToStageId: '',
        sendConfirmation: true,
        confirmationTemplate: '',
        notifyTeam: false,
        teamPhones: '',
        cancellationTemplate: '',
        reschedulingTemplate: '',
        reminderWindowStart: '08:00',
        reminderWindowEnd: '20:00',
        reminders: []
    });

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'general' | 'confirmation' | 'reminders' | 'cancellation'>('general');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, [templateId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [configsData, templateData] = await Promise.all([
                api.get(`/agent-templates/${templateId}/auto-scheduling`),
                api.get(`/agent-templates/${templateId}`)
            ]);
            setConfigs(Array.isArray(configsData) ? configsData : []);
            setAgent(templateData);
        } catch (error) {
            console.error('Error loading data:', error);
            showMessage('error', 'Não foi possível carregar os dados');
        } finally {
            setLoading(false);
        }
    };

    const loadConfigs = async () => {
        // Kept for refresh after save/delete
        try {
            const data = await api.get(`/agent-templates/${templateId}/auto-scheduling`);
            setConfigs(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading configs:', error);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleOpenModal = (config?: AutoSchedulingConfig & { reminders?: any[] }) => {
        // Validation: Block creation if no working hours are configured (only for new configs)
        if (!config && agent) {
            const hasWorkingHours = agent.workingHours &&
                Object.values(agent.workingHours).some((day: any) => day && day.length > 0);

            if (!hasWorkingHours) {
                showMessage('error', 'Configure os horários de atendimento na aba Calendário antes de criar uma regra.');
                return;
            }
        }

        setEditingConfig(config || null);
        if (config) {
            setFormData({
                crmStageId: config.crmStageId,
                duration: config.duration,
                minAdvanceHours: config.minAdvanceHours,
                preferredTime: config.preferredTime || 'any',
                daysOfWeek: Array.isArray(config.daysOfWeek) ? config.daysOfWeek : [],
                messageTemplate: config.messageTemplate || '',
                autoConfirm: config.autoConfirm || false,
                moveToStageId: config.moveToStageId || '',
                sendConfirmation: config.sendConfirmation ?? true,
                confirmationTemplate: config.confirmationTemplate || '',
                notifyTeam: config.notifyTeam || false,
                teamPhones: config.teamPhones?.join(',') || '',
                cancellationTemplate: config.cancellationTemplate || '',
                reschedulingTemplate: config.reschedulingTemplate || '',
                reminderWindowStart: config.reminderWindowStart || '08:00',
                reminderWindowEnd: config.reminderWindowEnd || '20:00',
                reminders: config.reminders || []
            });
        } else {
            // Reset form for new config and sync with working hours
            const workingDays = agent?.workingHours
                ? Object.keys(agent.workingHours).filter(day => agent.workingHours[day] && agent.workingHours[day].length > 0)
                : ['MON', 'TUE', 'WED', 'THU', 'FRI'];

            setFormData({
                crmStageId: '',
                duration: 60,
                minAdvanceHours: 2,
                preferredTime: 'any',
                daysOfWeek: workingDays,
                messageTemplate: '',
                autoConfirm: false,
                moveToStageId: '',
                sendConfirmation: true,
                confirmationTemplate: '',
                notifyTeam: false,
                teamPhones: '',
                cancellationTemplate: '',
                reschedulingTemplate: '',
                reminderWindowStart: '08:00',
                reminderWindowEnd: '20:00',
                reminders: []
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
                await api.put(`/agent-templates/${templateId}/auto-scheduling/${editingConfig.id}`, formData);
                showMessage('success', 'Configuração atualizada!');
            } else {
                await api.post(`/agent-templates/${templateId}/auto-scheduling`, formData);
                showMessage('success', 'Configuração criada!');
            }
            handleCloseModal();
            loadConfigs();
            onUpdate();
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
            await api.delete(`/agent-templates/${templateId}/auto-scheduling/${id}`);
            showMessage('success', 'Configuração excluída!');
            loadConfigs();
            onUpdate();
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
                    agentId={templateId}
                    editingConfig={editingConfig}
                />
            )}
        </div>
    );
}
