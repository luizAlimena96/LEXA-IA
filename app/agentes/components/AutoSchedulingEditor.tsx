'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Pencil, Trash2, Calendar, Clock, Info, TestTube2, X, Bell, Users, MessageSquare } from 'lucide-react';
import CRMStageSelector from '@/app/components/CRMStageSelector';

interface AutoSchedulingConfig {
    id: string;
    crmStageId: string;
    duration: number;
    minAdvanceHours: number;
    preferredTime?: string | null;
    daysOfWeek: string[];
    messageTemplate: string;
    autoConfirm: boolean;
    moveToStageId?: string | null;
    isActive: boolean;
    sendConfirmation: boolean;
    confirmationTemplate?: string | null;
    notifyTeam: boolean;
    teamPhones: string[];
    cancellationTemplate?: string | null;
    reschedulingTemplate?: string | null;
    crmStage?: {
        id: string;
        name: string;
        color: string;
    };
    moveToStage?: {
        id: string;
        name: string;
        color: string;
    } | null;
}

interface ReminderConfig {
    id: string;
    minutesBefore: number;
    sendToLead: boolean;
    sendToTeam: boolean;
    leadMessageTemplate: string;
    teamMessageTemplate?: string | null;
    isActive: boolean;
}

interface AutoSchedulingEditorProps {
    agentId: string;
}

interface FormData {
    crmStageId: string;
    duration: number;
    minAdvanceHours: number;
    preferredTime: string;
    daysOfWeek: string[];
    messageTemplate: string;
    autoConfirm: boolean;
    moveToStageId: string;
    sendConfirmation: boolean;
    confirmationTemplate: string;
    notifyTeam: boolean;
    teamPhones: string;
    cancellationTemplate: string;
    reschedulingTemplate: string;
}

const DAYS_OF_WEEK = [
    { value: 'MON', label: 'Segunda' },
    { value: 'TUE', label: 'Terça' },
    { value: 'WED', label: 'Quarta' },
    { value: 'THU', label: 'Quinta' },
    { value: 'FRI', label: 'Sexta' },
    { value: 'SAT', label: 'Sábado' },
    { value: 'SUN', label: 'Domingo' },
];

const DEFAULT_TEMPLATE = `Olá {{lead.name}}! 👋

Vamos agendar nossa conversa? Escolha um horário:

1️⃣ {{slot1.date}} às {{slot1.time}}
2️⃣ {{slot2.date}} às {{slot2.time}}
3️⃣ {{slot3.date}} às {{slot3.time}}

Responda com o número da opção ou sugira outro horário!`;

const DEFAULT_CONFIRMATION = `Olá {{lead.name}}! ✅

Seu agendamento foi confirmado:

📅 Data: {{appointment.date}}
🕐 Horário: {{appointment.time}}
⏱️ Duração: {{appointment.duration}} minutos

Nos vemos em breve!`;

const DEFAULT_REMINDER_1H = `{{lead.name}}, seu agendamento é daqui a 1 hora! ⏰

Horário: {{appointment.time}}

Estamos te esperando!`;

const DEFAULT_REMINDER_3H = `Oi {{lead.name}}! 👋

Lembrete: você tem um agendamento hoje às {{appointment.time}}.

Nos vemos em breve!`;

const DEFAULT_CANCELLATION = `Olá {{lead.name}},

Seu agendamento do dia {{appointment.date}} às {{appointment.time}} foi cancelado.

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
    const [formData, setFormData] = useState<FormData>({
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

    // Reminders state
    const [reminders, setReminders] = useState<ReminderConfig[]>([]);
    const [showReminderForm, setShowReminderForm] = useState(false);
    const [editingReminder, setEditingReminder] = useState<ReminderConfig | null>(null);
    const [reminderFormData, setReminderFormData] = useState({
        minutesBefore: 60,
        sendToLead: true,
        sendToTeam: false,
        leadMessageTemplate: DEFAULT_REMINDER_1H,
        teamMessageTemplate: '',
    });

    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testSlots, setTestSlots] = useState<any[]>([]);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'general' | 'confirmation' | 'reminders' | 'cancellation'>('general');

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
            const response = await fetch(`/api/agents/${agentId}/auto-scheduling`);

            if (!response.ok) {
                throw new Error('Erro ao carregar configurações');
            }

            const data = await response.json();
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
            const response = await fetch(`/api/agents/${agentId}/auto-scheduling/${editingConfig.id}/reminders`);
            if (response.ok) {
                const data = await response.json();
                setReminders(data);
            }
        } catch (error) {
            console.error('Error loading reminders:', error);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleOpenModal = (config?: AutoSchedulingConfig) => {
        if (config) {
            setEditingConfig(config);
            setFormData({
                crmStageId: config.crmStageId,
                duration: config.duration,
                minAdvanceHours: config.minAdvanceHours,
                preferredTime: config.preferredTime || 'any',
                daysOfWeek: config.daysOfWeek,
                messageTemplate: config.messageTemplate,
                autoConfirm: config.autoConfirm,
                moveToStageId: config.moveToStageId || '',
                sendConfirmation: config.sendConfirmation,
                confirmationTemplate: config.confirmationTemplate || DEFAULT_CONFIRMATION,
                notifyTeam: config.notifyTeam,
                teamPhones: config.teamPhones.join(', '),
                cancellationTemplate: config.cancellationTemplate || DEFAULT_CANCELLATION,
                reschedulingTemplate: config.reschedulingTemplate || DEFAULT_RESCHEDULING,
            });
        } else {
            setEditingConfig(null);
            setFormData({
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
            setReminders([]);
        }
        setTestSlots([]);
        setActiveTab('general');
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingConfig(null);
        setTestSlots([]);
        setReminders([]);
        setShowReminderForm(false);
    };

    const handleSave = async () => {
        if (!formData.crmStageId || !formData.messageTemplate) {
            showMessage('error', 'Etapa e mensagem são obrigatórios');
            return;
        }

        try {
            setSaving(true);
            const url = editingConfig
                ? `/api/agents/${agentId}/auto-scheduling/${editingConfig.id}`
                : `/api/agents/${agentId}/auto-scheduling`;

            const method = editingConfig ? 'PUT' : 'POST';

            // Parse team phones
            const teamPhonesArray = formData.teamPhones
                .split(',')
                .map(p => p.trim())
                .filter(p => p.length > 0);

            const payload = {
                ...formData,
                moveToStageId: formData.moveToStageId || null,
                teamPhones: teamPhonesArray,
            };

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao salvar');
            }

            const savedConfig = await response.json();
            setEditingConfig(savedConfig);
            showMessage('success', editingConfig ? 'Configuração atualizada!' : 'Configuração criada!');
            loadConfigs();
        } catch (error: any) {
            console.error('Error saving config:', error);
            showMessage('error', error.message || 'Erro ao salvar configuração');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta configuração?')) {
            return;
        }

        try {
            const response = await fetch(`/api/agents/${agentId}/auto-scheduling/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Erro ao excluir');
            }

            showMessage('success', 'Configuração excluída!');
            loadConfigs();
        } catch (error) {
            console.error('Error deleting config:', error);
            showMessage('error', 'Erro ao excluir configuração');
        }
    };

    const handleTestSlots = async () => {
        if (!editingConfig) {
            showMessage('error', 'Salve a configuração primeiro para testar');
            return;
        }

        try {
            setTesting(true);
            const response = await fetch(`/api/agents/${agentId}/auto-scheduling/test-slots`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ configId: editingConfig.id, limit: 3 }),
            });

            if (!response.ok) {
                throw new Error('Erro ao testar horários');
            }

            const data = await response.json();
            setTestSlots(data.slots || []);
            showMessage('success', `${data.slots.length} horários encontrados!`);
        } catch (error) {
            console.error('Error testing slots:', error);
            showMessage('error', 'Erro ao testar horários');
        } finally {
            setTesting(false);
        }
    };

    const toggleDay = (day: string) => {
        setFormData((prev) => ({
            ...prev,
            daysOfWeek: prev.daysOfWeek.includes(day)
                ? prev.daysOfWeek.filter((d) => d !== day)
                : [...prev.daysOfWeek, day],
        }));
    };

    // Reminder functions
    const handleSaveReminder = async () => {
        if (!editingConfig) return;

        try {
            const url = editingReminder
                ? `/api/agents/${agentId}/auto-scheduling/${editingConfig.id}/reminders/${editingReminder.id}`
                : `/api/agents/${agentId}/auto-scheduling/${editingConfig.id}/reminders`;

            const method = editingReminder ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reminderFormData),
            });

            if (!response.ok) {
                throw new Error('Erro ao salvar lembrete');
            }

            showMessage('success', 'Lembrete salvo!');
            loadReminders();
            setShowReminderForm(false);
            setEditingReminder(null);
            setReminderFormData({
                minutesBefore: 60,
                sendToLead: true,
                sendToTeam: false,
                leadMessageTemplate: DEFAULT_REMINDER_1H,
                teamMessageTemplate: '',
            });
        } catch (error) {
            console.error('Error saving reminder:', error);
            showMessage('error', 'Erro ao salvar lembrete');
        }
    };

    const handleDeleteReminder = async (id: string) => {
        if (!editingConfig || !confirm('Excluir este lembrete?')) return;

        try {
            const response = await fetch(
                `/api/agents/${agentId}/auto-scheduling/${editingConfig.id}/reminders/${id}`,
                { method: 'DELETE' }
            );

            if (!response.ok) {
                throw new Error('Erro ao excluir');
            }

            showMessage('success', 'Lembrete excluído!');
            loadReminders();
        } catch (error) {
            console.error('Error deleting reminder:', error);
            showMessage('error', 'Erro ao excluir lembrete');
        }
    };

    const handleEditReminder = (reminder: ReminderConfig) => {
        setEditingReminder(reminder);
        setReminderFormData({
            minutesBefore: reminder.minutesBefore,
            sendToLead: reminder.sendToLead,
            sendToTeam: reminder.sendToTeam,
            leadMessageTemplate: reminder.leadMessageTemplate,
            teamMessageTemplate: reminder.teamMessageTemplate || '',
        });
        setShowReminderForm(true);
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
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    <div className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        <span>{message.text}</span>
                    </div>
                </div>
            )}

            {/* Info Alert */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-2">
                    <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
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
                    <h3 className="text-lg font-semibold text-gray-900">Configurações de Agendamento</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        {configs.length} configuração{configs.length !== 1 ? 'ões' : ''} ativa{configs.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Nova Configuração
                </button>
            </div>

            {/* Configs List */}
            {configs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">Nenhuma configuração criada</p>
                    <p className="text-sm text-gray-500 mt-1">Clique em "Nova Configuração" para começar</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {configs.map((config) => (
                        <div
                            key={config.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        {config.crmStage && (
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: config.crmStage.color }}
                                            />
                                        )}
                                        <span className="font-semibold text-gray-900">
                                            {config.crmStage?.name || 'Etapa'}
                                        </span>
                                        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                                            {config.duration}min
                                        </span>
                                        {config.sendConfirmation && (
                                            <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                                                ✓ Confirmação
                                            </span>
                                        )}
                                        {config.notifyTeam && (
                                            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                                                <Users className="h-3 w-3 inline mr-1" />
                                                Equipe
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p>
                                            <Clock className="h-3 w-3 inline mr-1" />
                                            Antecedência: {config.minAdvanceHours}h | Preferência: {config.preferredTime === 'morning' ? 'Manhã' : config.preferredTime === 'afternoon' ? 'Tarde' : 'Qualquer'}
                                        </p>
                                        <p>
                                            Dias: {config.daysOfWeek.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label).join(', ')}
                                        </p>
                                        {config.moveToStage && (
                                            <p className="text-xs text-indigo-600">
                                                → Move para: {config.moveToStage.name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleOpenModal(config)}
                                        className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                        title="Editar"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(config.id)}
                                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 bg-gray-500/10 backdrop-blur-md flex items-center justify-center p-4 z-50"
                    onClick={handleCloseModal}
                >
                    <div
                        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editingConfig ? 'Editar Configuração' : 'Nova Configuração'}
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="border-b border-gray-200 px-6">
                            <div className="flex gap-4">
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
                                            ? 'border-indigo-600 text-indigo-600 font-medium'
                                            : 'border-transparent text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        <tab.icon className="h-4 w-4" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            {/* General Tab */}
                            {activeTab === 'general' && (
                                <div className="space-y-4">
                                    {/* CRM Stage */}
                                    <CRMStageSelector
                                        agentId={agentId}
                                        value={formData.crmStageId}
                                        onChange={(id) => setFormData({ ...formData, crmStageId: id || '' })}
                                        label="Etapa que Ativa Agendamento"
                                        placeholder="Selecione a etapa..."
                                        required
                                        showStates
                                    />

                                    {/* Duration and Advance */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Duração da Reunião
                                            </label>
                                            <select
                                                value={formData.duration}
                                                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value={30}>30 minutos</option>
                                                <option value={60}>1 hora</option>
                                                <option value={90}>1h 30min</option>
                                                <option value={120}>2 horas</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Antecedência Mínima
                                            </label>
                                            <select
                                                value={formData.minAdvanceHours}
                                                onChange={(e) => setFormData({ ...formData, minAdvanceHours: Number(e.target.value) })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value={2}>2 horas</option>
                                                <option value={4}>4 horas</option>
                                                <option value={24}>24 horas</option>
                                                <option value={48}>48 horas</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Preferred Time */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Horário Preferencial
                                        </label>
                                        <div className="flex gap-2">
                                            {[
                                                { value: 'any', label: 'Qualquer' },
                                                { value: 'morning', label: 'Manhã' },
                                                { value: 'afternoon', label: 'Tarde' },
                                            ].map((option) => (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, preferredTime: option.value })}
                                                    className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${formData.preferredTime === option.value
                                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium'
                                                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                                                        }`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Days of Week */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Dias Disponíveis
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {DAYS_OF_WEEK.map((day) => (
                                                <button
                                                    key={day.value}
                                                    type="button"
                                                    onClick={() => toggleDay(day.value)}
                                                    className={`px-3 py-2 rounded-lg border-2 transition-colors ${formData.daysOfWeek.includes(day.value)
                                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium'
                                                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                                                        }`}
                                                >
                                                    {day.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Message Template */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Mensagem para o Lead *
                                        </label>
                                        <textarea
                                            value={formData.messageTemplate}
                                            onChange={(e) => setFormData({ ...formData, messageTemplate: e.target.value })}
                                            placeholder={DEFAULT_TEMPLATE}
                                            rows={8}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Use: {'{{lead.name}}'}, {'{{slot1.date}}'}, {'{{slot1.time}}'}
                                        </p>
                                    </div>

                                    {/* Move To Stage */}
                                    <CRMStageSelector
                                        agentId={agentId}
                                        value={formData.moveToStageId}
                                        onChange={(id) => setFormData({ ...formData, moveToStageId: id || '' })}
                                        label="Mover para Etapa (Após Agendamento)"
                                        placeholder="Opcional - manter na mesma etapa"
                                    />

                                    {/* Auto Confirm */}
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="autoConfirm"
                                            checked={formData.autoConfirm}
                                            onChange={(e) => setFormData({ ...formData, autoConfirm: e.target.checked })}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="autoConfirm" className="text-sm text-gray-700">
                                            Confirmar automaticamente (sem aguardar resposta do lead)
                                        </label>
                                    </div>

                                    {/* Test Slots */}
                                    {editingConfig && (
                                        <div className="border-t pt-4">
                                            <button
                                                type="button"
                                                onClick={handleTestSlots}
                                                disabled={testing}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                            >
                                                {testing ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Testando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <TestTube2 className="h-4 w-4" />
                                                        Testar Horários Disponíveis
                                                    </>
                                                )}
                                            </button>

                                            {testSlots.length > 0 && (
                                                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                                    <p className="text-sm font-medium text-green-900 mb-2">
                                                        Próximos horários disponíveis:
                                                    </p>
                                                    <ul className="text-sm text-green-800 space-y-1">
                                                        {testSlots.map((slot, i) => (
                                                            <li key={i}>
                                                                {i + 1}. {slot.date} às {slot.time}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Confirmation Tab */}
                            {activeTab === 'confirmation' && (
                                <div className="space-y-4">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-sm text-blue-800">
                                            <Info className="h-4 w-4 inline mr-1" />
                                            Configure as mensagens de confirmação enviadas quando um agendamento é criado.
                                        </p>
                                    </div>

                                    {/* Send Confirmation */}
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="sendConfirmation"
                                            checked={formData.sendConfirmation}
                                            onChange={(e) => setFormData({ ...formData, sendConfirmation: e.target.checked })}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="sendConfirmation" className="text-sm font-medium text-gray-700">
                                            Enviar confirmação para o lead
                                        </label>
                                    </div>

                                    {/* Confirmation Template */}
                                    {formData.sendConfirmation && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Mensagem de Confirmação para Lead
                                            </label>
                                            <textarea
                                                value={formData.confirmationTemplate}
                                                onChange={(e) => setFormData({ ...formData, confirmationTemplate: e.target.value })}
                                                placeholder={DEFAULT_CONFIRMATION}
                                                rows={8}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Use: {'{{lead.name}}'}, {'{{appointment.date}}'}, {'{{appointment.time}}'}
                                            </p>
                                        </div>
                                    )}

                                    {/* Notify Team */}
                                    <div className="border-t pt-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <input
                                                type="checkbox"
                                                id="notifyTeam"
                                                checked={formData.notifyTeam}
                                                onChange={(e) => setFormData({ ...formData, notifyTeam: e.target.checked })}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <label htmlFor="notifyTeam" className="text-sm font-medium text-gray-700">
                                                <Users className="h-4 w-4 inline mr-1" />
                                                Notificar equipe
                                            </label>
                                        </div>

                                        {formData.notifyTeam && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Telefones da Equipe (separados por vírgula)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.teamPhones}
                                                    onChange={(e) => setFormData({ ...formData, teamPhones: e.target.value })}
                                                    placeholder="5511999999999, 5511888888888"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Estes números receberão notificações de novos agendamentos
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Reminders Tab */}
                            {activeTab === 'reminders' && (
                                <div className="space-y-4">
                                    {!editingConfig ? (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <p className="text-sm text-yellow-800">
                                                <Info className="h-4 w-4 inline mr-1" />
                                                Salve a configuração primeiro para adicionar lembretes.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                <p className="text-sm text-blue-800">
                                                    <Bell className="h-4 w-4 inline mr-1" />
                                                    Configure lembretes automáticos enviados antes do agendamento.
                                                </p>
                                            </div>

                                            {/* Reminders List */}
                                            <div className="space-y-2">
                                                {reminders.map((reminder) => (
                                                    <div
                                                        key={reminder.id}
                                                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-indigo-300"
                                                    >
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <Clock className="h-4 w-4 text-gray-500" />
                                                                <span className="font-medium text-gray-900">
                                                                    {reminder.minutesBefore} minutos antes
                                                                </span>
                                                                {reminder.sendToLead && (
                                                                    <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                                                                        Lead
                                                                    </span>
                                                                )}
                                                                {reminder.sendToTeam && (
                                                                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                                                                        Equipe
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-600 truncate">
                                                                {reminder.leadMessageTemplate.substring(0, 60)}...
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => handleEditReminder(reminder)}
                                                                className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteReminder(reminder.id)}
                                                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}

                                                {reminders.length === 0 && !showReminderForm && (
                                                    <div className="text-center py-8 text-gray-500">
                                                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                        <p className="text-sm">Nenhum lembrete configurado</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Add Reminder Button */}
                                            {!showReminderForm && (
                                                <button
                                                    onClick={() => {
                                                        setEditingReminder(null);
                                                        setReminderFormData({
                                                            minutesBefore: 60,
                                                            sendToLead: true,
                                                            sendToTeam: false,
                                                            leadMessageTemplate: DEFAULT_REMINDER_1H,
                                                            teamMessageTemplate: '',
                                                        });
                                                        setShowReminderForm(true);
                                                    }}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    Adicionar Lembrete
                                                </button>
                                            )}

                                            {/* Reminder Form */}
                                            {showReminderForm && (
                                                <div className="border-2 border-indigo-200 rounded-lg p-4 bg-indigo-50">
                                                    <h4 className="font-medium text-gray-900 mb-3">
                                                        {editingReminder ? 'Editar Lembrete' : 'Novo Lembrete'}
                                                    </h4>

                                                    <div className="space-y-3">
                                                        {/* Minutes Before */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Enviar quanto tempo antes?
                                                            </label>
                                                            <select
                                                                value={reminderFormData.minutesBefore}
                                                                onChange={(e) =>
                                                                    setReminderFormData({
                                                                        ...reminderFormData,
                                                                        minutesBefore: Number(e.target.value),
                                                                    })
                                                                }
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                            >
                                                                <option value={30}>30 minutos antes</option>
                                                                <option value={60}>1 hora antes</option>
                                                                <option value={120}>2 horas antes</option>
                                                                <option value={180}>3 horas antes</option>
                                                                <option value={1440}>1 dia antes</option>
                                                            </select>
                                                        </div>

                                                        {/* Send To Lead */}
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                id="sendToLead"
                                                                checked={reminderFormData.sendToLead}
                                                                onChange={(e) =>
                                                                    setReminderFormData({
                                                                        ...reminderFormData,
                                                                        sendToLead: e.target.checked,
                                                                    })
                                                                }
                                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                            <label htmlFor="sendToLead" className="text-sm font-medium text-gray-700">
                                                                Enviar para o lead
                                                            </label>
                                                        </div>

                                                        {/* Lead Message */}
                                                        {reminderFormData.sendToLead && (
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                    Mensagem para o Lead
                                                                </label>
                                                                <textarea
                                                                    value={reminderFormData.leadMessageTemplate}
                                                                    onChange={(e) =>
                                                                        setReminderFormData({
                                                                            ...reminderFormData,
                                                                            leadMessageTemplate: e.target.value,
                                                                        })
                                                                    }
                                                                    rows={4}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Send To Team */}
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                id="sendToTeamReminder"
                                                                checked={reminderFormData.sendToTeam}
                                                                onChange={(e) =>
                                                                    setReminderFormData({
                                                                        ...reminderFormData,
                                                                        sendToTeam: e.target.checked,
                                                                    })
                                                                }
                                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                            <label htmlFor="sendToTeamReminder" className="text-sm font-medium text-gray-700">
                                                                <Users className="h-4 w-4 inline mr-1" />
                                                                Enviar para a equipe
                                                            </label>
                                                        </div>

                                                        {/* Team Message */}
                                                        {reminderFormData.sendToTeam && (
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                    Mensagem para a Equipe (opcional)
                                                                </label>
                                                                <textarea
                                                                    value={reminderFormData.teamMessageTemplate}
                                                                    onChange={(e) =>
                                                                        setReminderFormData({
                                                                            ...reminderFormData,
                                                                            teamMessageTemplate: e.target.value,
                                                                        })
                                                                    }
                                                                    placeholder="Deixe em branco para usar a mesma mensagem do lead"
                                                                    rows={4}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Buttons */}
                                                        <div className="flex gap-2 pt-2">
                                                            <button
                                                                onClick={() => {
                                                                    setShowReminderForm(false);
                                                                    setEditingReminder(null);
                                                                }}
                                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                                            >
                                                                Cancelar
                                                            </button>
                                                            <button
                                                                onClick={handleSaveReminder}
                                                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                                            >
                                                                Salvar Lembrete
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Cancellation Tab */}
                            {activeTab === 'cancellation' && (
                                <div className="space-y-4">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-sm text-blue-800">
                                            <Info className="h-4 w-4 inline mr-1" />
                                            Configure as mensagens enviadas quando um agendamento é cancelado ou reagendado.
                                        </p>
                                    </div>

                                    {/* Cancellation Template */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Mensagem de Cancelamento
                                        </label>
                                        <textarea
                                            value={formData.cancellationTemplate}
                                            onChange={(e) => setFormData({ ...formData, cancellationTemplate: e.target.value })}
                                            placeholder={DEFAULT_CANCELLATION}
                                            rows={6}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Enviada quando um agendamento é cancelado
                                        </p>
                                    </div>

                                    {/* Rescheduling Template */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Mensagem de Reagendamento
                                        </label>
                                        <textarea
                                            value={formData.reschedulingTemplate}
                                            onChange={(e) => setFormData({ ...formData, reschedulingTemplate: e.target.value })}
                                            placeholder={DEFAULT_RESCHEDULING}
                                            rows={6}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Enviada quando um agendamento é reagendado para nova data/hora
                                        </p>
                                    </div>

                                    {/* Variables Help */}
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                            💡 Variáveis Disponíveis
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <p className="font-semibold text-gray-700">Lead:</p>
                                                <code className="text-gray-600">{'{{lead.name}}'}</code><br />
                                                <code className="text-gray-600">{'{{lead.phone}}'}</code><br />
                                                <code className="text-gray-600">{'{{lead.email}}'}</code>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-700">Agendamento:</p>
                                                <code className="text-gray-600">{'{{appointment.date}}'}</code><br />
                                                <code className="text-gray-600">{'{{appointment.time}}'}</code><br />
                                                <code className="text-gray-600">{'{{appointment.duration}}'}</code>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-2 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
                            <button
                                onClick={handleCloseModal}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Fechar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !formData.crmStageId || !formData.messageTemplate}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>Salvar Configuração</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
