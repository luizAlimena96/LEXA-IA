'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function AgentConfigPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [agent, setAgent] = useState<any>(null);

    const [config, setConfig] = useState({
        personality: '',
        systemPrompt: '',
        instructions: '',
        tone: 'FRIENDLY',
        workingHours: {
            seg: { enabled: true, start: '08:00', end: '18:00' },
            ter: { enabled: true, start: '08:00', end: '18:00' },
            qua: { enabled: true, start: '08:00', end: '18:00' },
            qui: { enabled: true, start: '08:00', end: '18:00' },
            sex: { enabled: true, start: '08:00', end: '18:00' },
            sab: { enabled: false, start: '09:00', end: '13:00' },
            dom: { enabled: false, start: '09:00', end: '13:00' },
        },
        meetingDuration: 60,
        bufferTime: 15,
        reminderEnabled: true,
        reminderHours: 2,
        reminderMessage: 'Olá {lead.name}! Lembrete: você tem uma reunião agendada para {appointment.date}',
        followupEnabled: true,
        followupDelay: 24,
    });

    useEffect(() => {
        loadAgent();
    }, []);

    const loadAgent = async () => {
        try {
            const res = await fetch(`/api/organizations/${orgId}`);
            const data = await res.json();

            if (data.agents && data.agents[0]) {
                const agentData = data.agents[0];
                setAgent(agentData);

                setConfig({
                    personality: agentData.personality || '',
                    systemPrompt: agentData.systemPrompt || '',
                    instructions: agentData.instructions || '',
                    tone: agentData.tone || 'FRIENDLY',
                    workingHours: agentData.workingHours || config.workingHours,
                    meetingDuration: agentData.meetingDuration || 60,
                    bufferTime: agentData.bufferTime || 15,
                    reminderEnabled: agentData.reminderEnabled ?? true,
                    reminderHours: agentData.reminderHours || 2,
                    reminderMessage: agentData.reminderMessage || config.reminderMessage,
                    followupEnabled: agentData.followupEnabled ?? true,
                    followupDelay: agentData.followupDelay || 24,
                });
            }
        } catch (error) {
            console.error('Error loading agent:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch(`/api/agents/${agent.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });
            alert('Configurações salvas com sucesso!');
        } catch (error) {
            console.error('Error saving:', error);
            alert('Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    const connectGoogleCalendar = async () => {
        try {
            const res = await fetch(`/api/google/auth?agentId=${agent.id}`);
            const data = await res.json();
            window.location.href = data.authUrl;
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const disconnectGoogleCalendar = async () => {
        try {
            await fetch('/api/google/disconnect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId: agent.id }),
            });
            loadAgent();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    if (loading) return <div className="p-8">Carregando...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Configuração do Agente IA</h1>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {saving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
            </div>

            {/* Perfil do Agente */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Perfil do Agente</h2>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Tom de Voz</label>
                    <select
                        value={config.tone}
                        onChange={(e) => setConfig({ ...config, tone: e.target.value })}
                        className="w-full p-2 border rounded"
                    >
                        <option value="FRIENDLY">Amigável</option>
                        <option value="PROFESSIONAL">Profissional</option>
                        <option value="CASUAL">Casual</option>
                        <option value="FORMAL">Formal</option>
                    </select>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Personalidade</label>
                    <textarea
                        value={config.personality}
                        onChange={(e) => setConfig({ ...config, personality: e.target.value })}
                        className="w-full p-2 border rounded h-24"
                        placeholder="Ex: Você é a LEXA, uma assistente virtual amigável e prestativa..."
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">System Prompt</label>
                    <textarea
                        value={config.systemPrompt}
                        onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                        className="w-full p-2 border rounded h-32"
                        placeholder="Instruções base para o sistema..."
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Instruções Específicas</label>
                    <textarea
                        value={config.instructions}
                        onChange={(e) => setConfig({ ...config, instructions: e.target.value })}
                        className="w-full p-2 border rounded h-24"
                        placeholder="Instruções adicionais..."
                    />
                </div>
            </div>

            {/* Google Calendar */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Google Calendar</h2>

                {agent?.googleCalendarEnabled ? (
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-600 font-medium">✓ Conectado</p>
                            <p className="text-sm text-gray-600">Calendário: {agent.googleCalendarId || 'primary'}</p>
                        </div>
                        <button
                            onClick={disconnectGoogleCalendar}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            Desconectar
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={connectGoogleCalendar}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Conectar Google Calendar
                    </button>
                )}
            </div>

            {/* Horário Comercial */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Horário Comercial</h2>

                {Object.entries(config.workingHours).map(([day, hours]: [string, any]) => (
                    <div key={day} className="flex items-center gap-4 mb-3">
                        <input
                            type="checkbox"
                            checked={hours.enabled}
                            onChange={(e) => setConfig({
                                ...config,
                                workingHours: {
                                    ...config.workingHours,
                                    [day]: { ...hours, enabled: e.target.checked }
                                }
                            })}
                        />
                        <span className="w-12 font-medium">{day.toUpperCase()}</span>
                        <input
                            type="time"
                            value={hours.start}
                            onChange={(e) => setConfig({
                                ...config,
                                workingHours: {
                                    ...config.workingHours,
                                    [day]: { ...hours, start: e.target.value }
                                }
                            })}
                            disabled={!hours.enabled}
                            className="p-2 border rounded"
                        />
                        <span>até</span>
                        <input
                            type="time"
                            value={hours.end}
                            onChange={(e) => setConfig({
                                ...config,
                                workingHours: {
                                    ...config.workingHours,
                                    [day]: { ...hours, end: e.target.value }
                                }
                            })}
                            disabled={!hours.enabled}
                            className="p-2 border rounded"
                        />
                    </div>
                ))}

                <div className="grid grid-cols-2 gap-4 mt-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">Duração da Reunião (min)</label>
                        <input
                            type="number"
                            value={config.meetingDuration}
                            onChange={(e) => setConfig({ ...config, meetingDuration: parseInt(e.target.value) })}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Buffer entre Reuniões (min)</label>
                        <input
                            type="number"
                            value={config.bufferTime}
                            onChange={(e) => setConfig({ ...config, bufferTime: parseInt(e.target.value) })}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                </div>
            </div>

            {/* Lembretes */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Lembretes Automáticos</h2>

                <div className="mb-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={config.reminderEnabled}
                            onChange={(e) => setConfig({ ...config, reminderEnabled: e.target.checked })}
                        />
                        <span>Ativar lembretes automáticos</span>
                    </label>
                </div>

                {config.reminderEnabled && (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Enviar lembrete (horas antes)</label>
                            <input
                                type="number"
                                value={config.reminderHours}
                                onChange={(e) => setConfig({ ...config, reminderHours: parseInt(e.target.value) })}
                                className="w-full p-2 border rounded"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Mensagem do Lembrete</label>
                            <textarea
                                value={config.reminderMessage}
                                onChange={(e) => setConfig({ ...config, reminderMessage: e.target.value })}
                                className="w-full p-2 border rounded h-24"
                                placeholder="Use: {lead.name}, {appointment.date}"
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Follow-ups */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Follow-ups Automáticos</h2>

                <div className="mb-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={config.followupEnabled}
                            onChange={(e) => setConfig({ ...config, followupEnabled: e.target.checked })}
                        />
                        <span>Ativar follow-ups automáticos</span>
                    </label>
                </div>

                {config.followupEnabled && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Delay de Inatividade (horas)</label>
                        <input
                            type="number"
                            value={config.followupDelay}
                            onChange={(e) => setConfig({ ...config, followupDelay: parseInt(e.target.value) })}
                            className="w-full p-2 border rounded"
                        />
                        <p className="text-sm text-gray-600 mt-1">
                            Follow-up será enviado se o lead não responder após este período
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
