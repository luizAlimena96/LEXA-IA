'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import api from '@/app/lib/api-client';
import { Plus, Edit2, Trash2, Clock, MessageSquare, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface WhatsAppTemplate {
    id: string;
    name: string;
    category: string;
    language: string;
    headerType?: string;
    headerContent?: string;
    bodyText: string;
    footerText?: string;
    buttons?: any;
    status: string;
    metaTemplateId?: string;
    createdAt: string;
    updatedAt: string;
}

interface Organization {
    id: string;
    preferredChannel?: string;
    whatsappCloudEnabled?: boolean;
}

export default function FollowupsPage() {
    const params = useParams();
    const orgId = params.id as string;

    // Active tab state
    const [activeTab, setActiveTab] = useState<'followups' | 'templates'>('followups');

    // Organization info
    const [organization, setOrganization] = useState<Organization | null>(null);

    // Follow-ups state
    const [followups, setFollowups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingFollowup, setEditingFollowup] = useState<any>(null);

    // Templates state
    const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
    const [templatesLoading, setTemplatesLoading] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);

    // Follow-up form
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

    // Template form
    const [templateForm, setTemplateForm] = useState({
        name: '',
        category: 'MARKETING',
        language: 'pt_BR',
        headerType: 'NONE',
        headerContent: '',
        bodyText: '',
        footerText: '',
    });

    useEffect(() => {
        loadOrganization();
        loadFollowups();
    }, []);

    const loadOrganization = async () => {
        try {
            const data = await api.organizations.get(orgId);
            console.log('[Followups] DEBUG - Organization data:', {
                id: data.id,
                name: data.name,
                preferredChannel: data.preferredChannel
            });
            setOrganization(data);
            // If cloud API is enabled, load templates
            if (data.preferredChannel === 'cloud_api') {
                console.log('[Followups] Cloud API enabled - loading templates');
                loadTemplates();
            } else {
                console.log('[Followups] preferredChannel is:', data.preferredChannel, '(not cloud_api)');
            }
        } catch (error) {
            console.error('Error loading organization:', error);
        }
    };

    const loadFollowups = async () => {
        try {
            const data = await api.organizations.followups.list(orgId);
            setFollowups(data);
        } catch (error) {
            console.error('Error loading followups:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTemplates = async () => {
        setTemplatesLoading(true);
        try {
            const data = await api.organizations.templates.list(orgId);
            setTemplates(data);
        } catch (error) {
            console.error('Error loading templates:', error);
            setTemplates([]);
        } finally {
            setTemplatesLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await api.organizations.followups.create(orgId, formData);
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
            await api.organizations.followups.delete(orgId, id);
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

    // Template handlers
    const handleSaveTemplate = async () => {
        try {
            if (editingTemplate) {
                await api.organizations.templates?.update?.(orgId, editingTemplate.id, templateForm);
            } else {
                await api.organizations.templates?.create?.(orgId, templateForm);
            }
            setShowTemplateModal(false);
            setEditingTemplate(null);
            loadTemplates();
        } catch (error) {
            console.error('Error saving template:', error);
            alert('Erro ao salvar template. API de templates ainda não implementada.');
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!confirm('Deletar este template?')) return;

        try {
            await api.organizations.templates?.delete?.(orgId, id);
            loadTemplates();
        } catch (error) {
            console.error('Error deleting template:', error);
        }
    };

    const openTemplateModal = (template?: WhatsAppTemplate) => {
        if (template) {
            setEditingTemplate(template);
            setTemplateForm({
                name: template.name,
                category: template.category,
                language: template.language,
                headerType: template.headerType || 'NONE',
                headerContent: template.headerContent || '',
                bodyText: template.bodyText,
                footerText: template.footerText || '',
            });
        } else {
            setEditingTemplate(null);
            setTemplateForm({
                name: '',
                category: 'MARKETING',
                language: 'pt_BR',
                headerType: 'NONE',
                headerContent: '',
                bodyText: '',
                footerText: '',
            });
        }
        setShowTemplateModal(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full"><CheckCircle className="w-3 h-3" />Aprovado</span>;
            case 'REJECTED':
                return <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded-full"><XCircle className="w-3 h-3" />Rejeitado</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs rounded-full"><AlertCircle className="w-3 h-3" />Pendente</span>;
        }
    };

    const isCloudApiEnabled = organization?.preferredChannel === 'cloud_api';

    if (loading) return <div className="p-8">Carregando...</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Follow-ups Automáticos</h1>
            </div>

            {/* Tabs - Only show if Cloud API is enabled */}
            {isCloudApiEnabled && (
                <div className="mb-6">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex gap-4">
                            <button
                                onClick={() => setActiveTab('followups')}
                                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'followups'
                                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                            >
                                <MessageSquare className="w-4 h-4 inline-block mr-2" />
                                Follow-ups
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab('templates');
                                    if (templates.length === 0) loadTemplates();
                                }}
                                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'templates'
                                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                            >
                                <FileText className="w-4 h-4 inline-block mr-2" />
                                Templates (API Oficial)
                            </button>
                        </nav>
                    </div>

                    {/* Info banner */}
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            <strong>API Oficial habilitada:</strong> Follow-ups fora da janela de 24h usarão automaticamente templates aprovados.
                        </p>
                    </div>
                </div>
            )}

            {/* Follow-ups Tab Content */}
            {activeTab === 'followups' && (
                <>
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => openModal()}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Novo Follow-up
                        </button>
                    </div>

                    <div className="grid gap-4">
                        {followups.map((followup) => (
                            <div key={followup.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{followup.name}</h3>
                                        <p className="text-gray-600 dark:text-gray-400 mt-2">{followup.message}</p>
                                        <div className="mt-4 flex gap-2 flex-wrap text-sm">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                                                <Clock className="w-3 h-3" />
                                                {followup.delayHours}h
                                            </span>
                                            {followup.respectBusinessHours && (
                                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                                    Horário Comercial
                                                </span>
                                            )}
                                            {followup.aiDecisionEnabled && (
                                                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                                                    Decisão IA
                                                </span>
                                            )}
                                            {followup.specificTimeEnabled && (
                                                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                                                    {followup.specificHour}:{String(followup.specificMinute).padStart(2, '0')}
                                                </span>
                                            )}
                                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                                                {followup.mediaType}
                                            </span>
                                            <span className={`px-2 py-1 rounded ${followup.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                                                {followup.isActive ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openModal(followup)}
                                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(followup.id)}
                                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {followups.length === 0 && (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                Nenhum follow-up configurado
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Templates Tab Content */}
            {activeTab === 'templates' && isCloudApiEnabled && (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Templates são necessários para enviar mensagens fora da janela de 24h na API Oficial.
                        </p>
                        <button
                            onClick={() => openTemplateModal()}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Novo Template
                        </button>
                    </div>

                    {templatesLoading ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            Carregando templates...
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {templates.map((template) => (
                                <div key={template.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{template.name}</h3>
                                                {getStatusBadge(template.status)}
                                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                                    {template.category}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400 mt-2 font-mono text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded">
                                                {template.bodyText}
                                            </p>
                                            {template.footerText && (
                                                <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
                                                    Rodapé: {template.footerText}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openTemplateModal(template)}
                                                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTemplate(template.id)}
                                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {templates.length === 0 && (
                                <div className="text-center py-12">
                                    <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400 mb-2">Nenhum template configurado</p>
                                    <p className="text-sm text-gray-400 dark:text-gray-500">
                                        Crie templates para enviar mensagens fora da janela de 24h
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Follow-up Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 bg-slate-900/30 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="bg-white dark:bg-[#12121d] rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                            {editingFollowup ? 'Editar' : 'Novo'} Follow-up
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nome</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] text-gray-900 dark:text-white rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Mensagem</label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] text-gray-900 dark:text-white rounded-lg h-24"
                                    placeholder="Use: {lead.name}, {lead.email}, {lead.phone}"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Delay (horas)</label>
                                <input
                                    type="number"
                                    value={formData.delayHours}
                                    onChange={(e) => setFormData({ ...formData, delayHours: parseInt(e.target.value) })}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] text-gray-900 dark:text-white rounded-lg"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.respectBusinessHours}
                                    onChange={(e) => setFormData({ ...formData, respectBusinessHours: e.target.checked })}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
                                />
                                <label className="text-gray-700 dark:text-gray-300">Respeitar horário comercial</label>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.aiDecisionEnabled}
                                    onChange={(e) => setFormData({ ...formData, aiDecisionEnabled: e.target.checked })}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
                                />
                                <label className="text-gray-700 dark:text-gray-300">IA decide se envia</label>
                            </div>

                            {formData.aiDecisionEnabled && (
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Prompt IA</label>
                                    <textarea
                                        value={formData.aiDecisionPrompt}
                                        onChange={(e) => setFormData({ ...formData, aiDecisionPrompt: e.target.value })}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] text-gray-900 dark:text-white rounded-lg h-20"
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.specificTimeEnabled}
                                    onChange={(e) => setFormData({ ...formData, specificTimeEnabled: e.target.checked })}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
                                />
                                <label className="text-gray-700 dark:text-gray-300">Horário específico</label>
                            </div>

                            {formData.specificTimeEnabled && (
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="number"
                                        min="0"
                                        max="23"
                                        value={formData.specificHour}
                                        onChange={(e) => setFormData({ ...formData, specificHour: parseInt(e.target.value) })}
                                        className="w-20 p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] text-gray-900 dark:text-white rounded-lg"
                                    />
                                    <span className="text-gray-700 dark:text-gray-300">:</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="59"
                                        value={formData.specificMinute}
                                        onChange={(e) => setFormData({ ...formData, specificMinute: parseInt(e.target.value) })}
                                        className="w-20 p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] text-gray-900 dark:text-white rounded-lg"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tipo de Mídia</label>
                                <select
                                    value={formData.mediaType}
                                    onChange={(e) => setFormData({ ...formData, mediaType: e.target.value })}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] text-gray-900 dark:text-white rounded-lg"
                                >
                                    <option value="text">Texto</option>
                                    <option value="image">Imagem</option>
                                    <option value="audio">Áudio</option>
                                </select>
                            </div>

                            {formData.mediaType === 'image' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">URL da Imagem</label>
                                    <input
                                        type="text"
                                        value={formData.mediaUrl}
                                        onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] text-gray-900 dark:text-white rounded-lg"
                                    />
                                </div>
                            )}

                            {formData.mediaType === 'audio' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Voice ID (ElevenLabs)</label>
                                    <input
                                        type="text"
                                        value={formData.audioVoiceId}
                                        onChange={(e) => setFormData({ ...formData, audioVoiceId: e.target.value })}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] text-gray-900 dark:text-white rounded-lg"
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
                                />
                                <label className="text-gray-700 dark:text-gray-300">Ativo</label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Template Modal */}
            {showTemplateModal && (
                <div
                    className="fixed inset-0 bg-slate-900/30 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    onClick={() => setShowTemplateModal(false)}
                >
                    <div
                        className="bg-white dark:bg-[#12121d] rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                            {editingTemplate ? 'Editar' : 'Novo'} Template
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                    Nome do Template
                                    <span className="text-gray-500 ml-1">(snake_case)</span>
                                </label>
                                <input
                                    type="text"
                                    value={templateForm.name}
                                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] text-gray-900 dark:text-white rounded-lg"
                                    placeholder="ex: follow_up_geral"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Categoria</label>
                                    <select
                                        value={templateForm.category}
                                        onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] text-gray-900 dark:text-white rounded-lg"
                                    >
                                        <option value="MARKETING">Marketing</option>
                                        <option value="UTILITY">Utilidade</option>
                                        <option value="AUTHENTICATION">Autenticação</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Idioma</label>
                                    <select
                                        value={templateForm.language}
                                        onChange={(e) => setTemplateForm({ ...templateForm, language: e.target.value })}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] text-gray-900 dark:text-white rounded-lg"
                                    >
                                        <option value="pt_BR">Português (BR)</option>
                                        <option value="en_US">English (US)</option>
                                        <option value="es_ES">Español</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tipo de Cabeçalho</label>
                                <select
                                    value={templateForm.headerType}
                                    onChange={(e) => setTemplateForm({ ...templateForm, headerType: e.target.value })}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] text-gray-900 dark:text-white rounded-lg"
                                >
                                    <option value="NONE">Nenhum</option>
                                    <option value="TEXT">Texto</option>
                                    <option value="IMAGE">Imagem</option>
                                    <option value="VIDEO">Vídeo</option>
                                    <option value="DOCUMENT">Documento</option>
                                </select>
                            </div>

                            {templateForm.headerType !== 'NONE' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                        {templateForm.headerType === 'TEXT' ? 'Texto do Cabeçalho' : 'URL do Cabeçalho'}
                                    </label>
                                    <input
                                        type="text"
                                        value={templateForm.headerContent}
                                        onChange={(e) => setTemplateForm({ ...templateForm, headerContent: e.target.value })}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] text-gray-900 dark:text-white rounded-lg"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                    Corpo da Mensagem
                                    <span className="text-gray-500 ml-1">(use {"{{1}}"}, {"{{2}}"} para variáveis)</span>
                                </label>
                                <textarea
                                    value={templateForm.bodyText}
                                    onChange={(e) => setTemplateForm({ ...templateForm, bodyText: e.target.value })}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] text-gray-900 dark:text-white rounded-lg h-32 font-mono text-sm"
                                    placeholder="Olá {{1}}! Temos novidades para você..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Rodapé (opcional)</label>
                                <input
                                    type="text"
                                    value={templateForm.footerText}
                                    onChange={(e) => setTemplateForm({ ...templateForm, footerText: e.target.value })}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] text-gray-900 dark:text-white rounded-lg"
                                    placeholder="Responda SAIR para não receber mais mensagens"
                                />
                            </div>

                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                    <strong>⚠️ Importante:</strong> Após criar o template aqui, você precisará submetê-lo para aprovação no Meta Business Suite. O processo leva de 24-48h.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => setShowTemplateModal(false)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveTemplate}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                Salvar Template
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
