'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Clock, Calendar, Users, Bell, Plus, Trash2, Save } from 'lucide-react';

interface TimeWindow {
    start: string;
    end: string;
}

interface CustomTimeWindows {
    seg?: TimeWindow[];
    ter?: TimeWindow[];
    qua?: TimeWindow[];
    qui?: TimeWindow[];
    sex?: TimeWindow[];
    sab?: TimeWindow[];
    dom?: TimeWindow[];
}

export default function AgendamentoAvancadoPage() {
    const params = useParams();
    const router = useRouter();
    const agentId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [config, setConfig] = useState({
        minAdvanceHours: 0,
        allowDynamicDuration: false,
        minMeetingDuration: 30,
        maxMeetingDuration: 120,
        useCustomTimeWindows: false,
        customTimeWindows: {} as CustomTimeWindows,
        notificationEnabled: false,
        notificationPhone: '',
        notificationTemplate: '',
        meetingDuration: 60,
        bufferTime: 15,
    });

    const daysOfWeek = [
        { key: 'seg', label: 'Segunda' },
        { key: 'ter', label: 'Terça' },
        { key: 'qua', label: 'Quarta' },
        { key: 'qui', label: 'Quinta' },
        { key: 'sex', label: 'Sexta' },
        { key: 'sab', label: 'Sábado' },
        { key: 'dom', label: 'Domingo' },
    ];

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const res = await fetch(`/api/agents/${agentId}/scheduling-rules`);
            if (res.ok) {
                const data = await res.json();
                setConfig({
                    ...data,
                    customTimeWindows: data.customTimeWindows || {},
                });
            }
        } catch (error) {
            console.error('Error loading config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/agents/${agentId}/scheduling-rules`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });

            if (res.ok) {
                alert('Configurações salvas com sucesso!');
            } else {
                alert('Erro ao salvar configurações');
            }
        } catch (error) {
            console.error('Error saving:', error);
            alert('Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    const addTimeWindow = (day: string) => {
        setConfig({
            ...config,
            customTimeWindows: {
                ...config.customTimeWindows,
                [day]: [
                    ...(config.customTimeWindows[day as keyof CustomTimeWindows] || []),
                    { start: '08:00', end: '12:00' }
                ]
            }
        });
    };

    const removeTimeWindow = (day: string, index: number) => {
        const windows = config.customTimeWindows[day as keyof CustomTimeWindows] || [];
        setConfig({
            ...config,
            customTimeWindows: {
                ...config.customTimeWindows,
                [day]: windows.filter((_, i) => i !== index)
            }
        });
    };

    const updateTimeWindow = (day: string, index: number, field: 'start' | 'end', value: string) => {
        const windows = [...(config.customTimeWindows[day as keyof CustomTimeWindows] || [])];
        windows[index] = { ...windows[index], [field]: value };
        setConfig({
            ...config,
            customTimeWindows: {
                ...config.customTimeWindows,
                [day]: windows
            }
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Agendamento Avançado</h1>
                    <p className="text-gray-600 mt-2">Configure regras avançadas de agendamento</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                    <Save className="w-5 h-5" />
                    {saving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
            </div>

            {/* Antecedência Mínima */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <Clock className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-xl font-bold text-gray-900">Antecedência Mínima</h2>
                </div>
                <p className="text-gray-600 mb-4">
                    Defina quanto tempo antes o cliente precisa agendar
                </p>
                <div className="max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Horas de antecedência
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={config.minAdvanceHours}
                        onChange={(e) => setConfig({ ...config, minAdvanceHours: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                        Exemplo: 3 horas = cliente só pode agendar com 3h de antecedência
                    </p>
                </div>
            </div>

            {/* Janelas de Horário Customizadas */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <Calendar className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-xl font-bold text-gray-900">Janelas de Horário Customizadas</h2>
                </div>
                <p className="text-gray-600 mb-4">
                    Defina horários específicos permitidos para cada dia da semana
                </p>

                <div className="mb-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={config.useCustomTimeWindows}
                            onChange={(e) => setConfig({ ...config, useCustomTimeWindows: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                            Usar janelas de horário customizadas
                        </span>
                    </label>
                </div>

                {config.useCustomTimeWindows && (
                    <div className="space-y-4">
                        {daysOfWeek.map(({ key, label }) => (
                            <div key={key} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-gray-900">{label}</h3>
                                    <button
                                        onClick={() => addTimeWindow(key)}
                                        className="flex items-center gap-1 px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Adicionar Janela
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {(config.customTimeWindows[key as keyof CustomTimeWindows] || []).map((window, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <input
                                                type="time"
                                                value={window.start}
                                                onChange={(e) => updateTimeWindow(key, index, 'start', e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <span className="text-gray-500">até</span>
                                            <input
                                                type="time"
                                                value={window.end}
                                                onChange={(e) => updateTimeWindow(key, index, 'end', e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <button
                                                onClick={() => removeTimeWindow(key, index)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}

                                    {(!config.customTimeWindows[key as keyof CustomTimeWindows] || config.customTimeWindows[key as keyof CustomTimeWindows]!.length === 0) && (
                                        <p className="text-sm text-gray-500 italic">
                                            Nenhuma janela configurada (dia bloqueado)
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Duração Dinâmica */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <Users className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-xl font-bold text-gray-900">Duração Dinâmica</h2>
                </div>
                <p className="text-gray-600 mb-4">
                    Permita que a IA ajuste a duração da reunião baseado no contexto
                </p>

                <div className="mb-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={config.allowDynamicDuration}
                            onChange={(e) => setConfig({ ...config, allowDynamicDuration: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                            Permitir duração dinâmica
                        </span>
                    </label>
                </div>

                {config.allowDynamicDuration && (
                    <div className="grid grid-cols-2 gap-4 max-w-md">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Duração mínima (min)
                            </label>
                            <input
                                type="number"
                                min="15"
                                step="15"
                                value={config.minMeetingDuration}
                                onChange={(e) => setConfig({ ...config, minMeetingDuration: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Duração máxima (min)
                            </label>
                            <input
                                type="number"
                                min="30"
                                step="15"
                                value={config.maxMeetingDuration}
                                onChange={(e) => setConfig({ ...config, maxMeetingDuration: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Notificações de Equipe */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Bell className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-xl font-bold text-gray-900">Notificações de Equipe</h2>
                </div>
                <p className="text-gray-600 mb-4">
                    Receba notificações via WhatsApp quando um agendamento for criado
                </p>

                <div className="mb-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={config.notificationEnabled}
                            onChange={(e) => setConfig({ ...config, notificationEnabled: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                            Ativar notificações
                        </span>
                    </label>
                </div>

                {config.notificationEnabled && (
                    <div className="space-y-4">
                        <div className="max-w-md">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Telefone da equipe (com DDD)
                            </label>
                            <input
                                type="tel"
                                value={config.notificationPhone}
                                onChange={(e) => setConfig({ ...config, notificationPhone: e.target.value })}
                                placeholder="11999999999"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Template da mensagem
                            </label>
                            <textarea
                                value={config.notificationTemplate}
                                onChange={(e) => setConfig({ ...config, notificationTemplate: e.target.value })}
                                rows={6}
                                placeholder="📈 | **NOVO AGENDAMENTO**&#10;&#10;📅 *Data: {date}*&#10;&#10;• Whatsapp: {phone}&#10;• Email: {email}&#10;• Nome: {name}"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                            />
                            <p className="text-sm text-gray-500 mt-2">
                                Variáveis disponíveis: <code className="bg-gray-100 px-1 rounded">{'{date}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{phone}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{email}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{name}'}</code>
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
