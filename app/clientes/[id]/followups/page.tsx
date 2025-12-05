'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function FollowupsPage() {
    const params = useParams();
    const orgId = params.id as string;

    const [followups, setFollowups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingFollowup, setEditingFollowup] = useState<any>(null);

    const [formData, setFormData] = useState({
        name: '',
        condition: 'NEW',
        message: '',
        delayHours: 24,
        respectBusinessHours: false,
        aiDecisionEnabled: false,
        aiDecisionPrompt: '',
        specificTimeEnabled: false,
        specificHour: 9,
        specificMinute: 0,
        mediaType: 'text',
        mediaUrl: '',
        audioVoiceId: '',
        isActive: true,
    });

    useEffect(() => {
        loadFollowups();
    }, []);

    const loadFollowups = async () => {
        try {
            const res = await fetch(`/api/organizations/${orgId}/followups`);
            const data = await res.json();
            setFollowups(data);
        } catch (error) {
            console.error('Error loading followups:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const url = editingFollowup
                ? `/api/organizations/${orgId}/followups/${editingFollowup.id}`
                : `/api/organizations/${orgId}/followups`;

            await fetch(url, {
                method: editingFollowup ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            setShowModal(false);
            setEditingFollowup(null);
            loadFollowups();
        } catch (error) {
            console.error('Error saving followup:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deletar este follow-up?')) return;

        try {
            await fetch(`/api/organizations/${orgId}/followups/${id}`, {
                method: 'DELETE',
            });
            loadFollowups();
        } catch (error) {
            console.error('Error deleting followup:', error);
        }
    };

    const openModal = (followup?: any) => {
        if (followup) {
            setEditingFollowup(followup);
            setFormData(followup);
        } else {
            setEditingFollowup(null);
            setFormData({
                name: '',
                condition: 'NEW',
                message: '',
                delayHours: 24,
                respectBusinessHours: false,
                aiDecisionEnabled: false,
                aiDecisionPrompt: '',
                specificTimeEnabled: false,
                specificHour: 9,
                specificMinute: 0,
                mediaType: 'text',
                mediaUrl: '',
                audioVoiceId: '',
                isActive: true,
            });
        }
        setShowModal(true);
    };

    if (loading) return <div className="p-8">Carregando...</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Follow-ups Automáticos</h1>
                <button
                    onClick={() => openModal()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    + Novo Follow-up
                </button>
            </div>

            <div className="grid gap-4">
                {followups.map((followup) => (
                    <div key={followup.id} className="bg-white p-6 rounded-lg shadow">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h3 className="text-xl font-bold">{followup.name}</h3>
                                <p className="text-gray-600 mt-2">{followup.message}</p>
                                <div className="mt-4 flex gap-4 text-sm">
                                    <span className="px-2 py-1 bg-gray-100 rounded">
                                        Delay: {followup.delayHours}h
                                    </span>
                                    {followup.respectBusinessHours && (
                                        <span className="px-2 py-1 bg-blue-100 rounded">
                                            Horário Comercial
                                        </span>
                                    )}
                                    {followup.aiDecisionEnabled && (
                                        <span className="px-2 py-1 bg-purple-100 rounded">
                                            Decisão IA
                                        </span>
                                    )}
                                    {followup.specificTimeEnabled && (
                                        <span className="px-2 py-1 bg-green-100 rounded">
                                            {followup.specificHour}:{String(followup.specificMinute).padStart(2, '0')}
                                        </span>
                                    )}
                                    <span className="px-2 py-1 bg-gray-100 rounded">
                                        {followup.mediaType}
                                    </span>
                                    <span
                                        className={`px-2 py-1 rounded ${followup.isActive ? 'bg-green-100' : 'bg-red-100'
                                            }`}
                                    >
                                        {followup.isActive ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => openModal(followup)}
                                    className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                                >
                                    Editar
                                </button>
                                <button
                                    onClick={() => handleDelete(followup.id)}
                                    className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                                >
                                    Deletar
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4">
                            {editingFollowup ? 'Editar' : 'Novo'} Follow-up
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nome</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-2 border rounded"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Mensagem</label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className="w-full p-2 border rounded h-24"
                                    placeholder="Use: {lead.name}, {lead.email}, {lead.phone}"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Delay (horas)</label>
                                <input
                                    type="number"
                                    value={formData.delayHours}
                                    onChange={(e) =>
                                        setFormData({ ...formData, delayHours: parseInt(e.target.value) })
                                    }
                                    className="w-full p-2 border rounded"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.respectBusinessHours}
                                    onChange={(e) =>
                                        setFormData({ ...formData, respectBusinessHours: e.target.checked })
                                    }
                                />
                                <label>Respeitar horário comercial</label>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.aiDecisionEnabled}
                                    onChange={(e) =>
                                        setFormData({ ...formData, aiDecisionEnabled: e.target.checked })
                                    }
                                />
                                <label>IA decide se envia</label>
                            </div>

                            {formData.aiDecisionEnabled && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Prompt IA</label>
                                    <textarea
                                        value={formData.aiDecisionPrompt}
                                        onChange={(e) =>
                                            setFormData({ ...formData, aiDecisionPrompt: e.target.value })
                                        }
                                        className="w-full p-2 border rounded h-20"
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.specificTimeEnabled}
                                    onChange={(e) =>
                                        setFormData({ ...formData, specificTimeEnabled: e.target.checked })
                                    }
                                />
                                <label>Horário específico</label>
                            </div>

                            {formData.specificTimeEnabled && (
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        max="23"
                                        value={formData.specificHour}
                                        onChange={(e) =>
                                            setFormData({ ...formData, specificHour: parseInt(e.target.value) })
                                        }
                                        className="w-20 p-2 border rounded"
                                    />
                                    <span>:</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="59"
                                        value={formData.specificMinute}
                                        onChange={(e) =>
                                            setFormData({ ...formData, specificMinute: parseInt(e.target.value) })
                                        }
                                        className="w-20 p-2 border rounded"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-1">Tipo de Mídia</label>
                                <select
                                    value={formData.mediaType}
                                    onChange={(e) => setFormData({ ...formData, mediaType: e.target.value })}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="text">Texto</option>
                                    <option value="image">Imagem</option>
                                    <option value="audio">Áudio</option>
                                </select>
                            </div>

                            {formData.mediaType === 'image' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">URL da Imagem</label>
                                    <input
                                        type="text"
                                        value={formData.mediaUrl}
                                        onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                                        className="w-full p-2 border rounded"
                                    />
                                </div>
                            )}

                            {formData.mediaType === 'audio' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Voice ID (ElevenLabs)</label>
                                    <input
                                        type="text"
                                        value={formData.audioVoiceId}
                                        onChange={(e) =>
                                            setFormData({ ...formData, audioVoiceId: e.target.value })
                                        }
                                        className="w-full p-2 border rounded"
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                />
                                <label>Ativo</label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border rounded hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
