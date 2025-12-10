'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Wifi, WifiOff, Building2, Users, Bot, UserCircle, Eye, EyeOff } from 'lucide-react';

interface Organization {
    id: string;
    name: string;
    slug: string;
    email?: string;
    phone?: string;
    isActive: boolean;
    whatsappConnected: boolean;
    crmEnabled: boolean;
    crmType?: string;
    openaiApiKey?: string;
    openaiProjectId?: string;
    elevenLabsApiKey?: string;
    elevenLabsVoiceId?: string;
    evolutionApiUrl?: string;
    evolutionInstanceName?: string;
    zapSignApiToken?: string;
    zapSignTemplateId?: string;
    _count?: {
        users: number;
        agents: number;
        leads: number;
    };
}

export default function ClientesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
    const [showOpenAI, setShowOpenAI] = useState(false);
    const [showElevenLabs, setShowElevenLabs] = useState(false);
    const [showEvolution, setShowEvolution] = useState(false);
    const [showZapSign, setShowZapSign] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        email: '',
        phone: '',
        openaiApiKey: '',
        openaiProjectId: '',
        elevenLabsApiKey: '',
        elevenLabsVoiceId: '',
        evolutionApiUrl: '',
        evolutionInstanceName: '',
        zapSignApiToken: '',
        zapSignTemplateId: '',
    });

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated' && session?.user?.role !== 'SUPER_ADMIN') {
            router.push('/dashboard');
        } else if (status === 'authenticated') {
            loadOrganizations();
        }
    }, [status, session, router]);

    const loadOrganizations = async () => {
        try {
            const response = await fetch('/api/organizations');
            if (response.ok) {
                const data = await response.json();
                setOrganizations(data);
            }
        } catch (error) {
            console.error('Error loading organizations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingOrg(null);
        setFormData({
            name: '',
            slug: '',
            email: '',
            phone: '',
            openaiApiKey: '',
            openaiProjectId: '',
            elevenLabsApiKey: '',
            elevenLabsVoiceId: '',
            evolutionApiUrl: '',
            evolutionInstanceName: '',
            zapSignApiToken: '',
            zapSignTemplateId: '',
        });
        setShowModal(true);
    };

    const handleEdit = (org: Organization) => {
        setEditingOrg(org);
        setFormData({
            name: org.name,
            slug: org.slug,
            email: org.email || '',
            phone: org.phone || '',
            openaiApiKey: org.openaiApiKey || '',
            openaiProjectId: org.openaiProjectId || '',
            elevenLabsApiKey: org.elevenLabsApiKey || '',
            elevenLabsVoiceId: org.elevenLabsVoiceId || '',
            evolutionApiUrl: org.evolutionApiUrl || '',
            evolutionInstanceName: org.evolutionInstanceName || '',
            zapSignApiToken: org.zapSignApiToken || '',
            zapSignTemplateId: org.zapSignTemplateId || '',
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editingOrg
                ? `/api/organizations?id=${editingOrg.id}`
                : '/api/organizations';

            const response = await fetch(url, {
                method: editingOrg ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setShowModal(false);
                loadOrganizations();

                // Trigger organization change event
                window.dispatchEvent(new Event('organizationChanged'));
            } else {
                const error = await response.json();
                alert(error.error || 'Erro ao salvar organização');
            }
        } catch (error) {
            console.error('Error saving organization:', error);
            alert('Erro ao salvar organização');
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Deseja realmente deletar a organização "${name}"? Esta ação não pode ser desfeita.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/organizations?id=${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                loadOrganizations();

                // Trigger organization change event
                window.dispatchEvent(new Event('organizationChanged'));
            } else {
                alert('Erro ao deletar organização');
            }
        } catch (error) {
            console.error('Error deleting organization:', error);
            alert('Erro ao deletar organização');
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando...</p>
                </div>
            </div>
        );
    }

    if (session?.user?.role !== 'SUPER_ADMIN') {
        return null;
    }

    return (
        <div className="p-8">
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gerenciamento de Clientes</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Gerencie todas as organizações do sistema</p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Adicionar Cliente
                    </button>
                </div>
            </div>

            {/* Organizations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {organizations.map((org) => (
                    <div
                        key={org.id}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                    <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">{org.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">/{org.slug}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(org)}
                                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    title="Editar"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(org.id, org.name)}
                                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Deletar"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {(org.email || org.phone) && (
                            <div className="mb-4 space-y-1">
                                {org.email && <p className="text-sm text-gray-600 dark:text-gray-400">📧 {org.email}</p>}
                                {org.phone && <p className="text-sm text-gray-600 dark:text-gray-400">📱 {org.phone}</p>}
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                                <Users className="w-4 h-4 mx-auto text-gray-600 dark:text-gray-400 mb-1" />
                                <p className="text-xs text-gray-500 dark:text-gray-400">Usuários</p>
                                <p className="font-semibold text-gray-900 dark:text-white">{org._count?.users || 0}</p>
                            </div>
                            <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                                <Bot className="w-4 h-4 mx-auto text-gray-600 dark:text-gray-400 mb-1" />
                                <p className="text-xs text-gray-500 dark:text-gray-400">Agentes</p>
                                <p className="font-semibold text-gray-900 dark:text-white">{org._count?.agents || 0}</p>
                            </div>
                            <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                                <UserCircle className="w-4 h-4 mx-auto text-gray-600 dark:text-gray-400 mb-1" />
                                <p className="text-xs text-gray-500 dark:text-gray-400">Leads</p>
                                <p className="font-semibold text-gray-900 dark:text-white">{org._count?.leads || 0}</p>
                            </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${org.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                                {org.isActive ? <><CheckCircle className="w-3 h-3" />Ativo</> : <><XCircle className="w-3 h-3" />Inativo</>}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${org.whatsappConnected ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                                {org.whatsappConnected ? <><Wifi className="w-3 h-3" />WhatsApp</> : <><WifiOff className="w-3 h-3" />WhatsApp</>}
                            </span>
                            {org.crmEnabled && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                    CRM {org.crmType && `(${org.crmType})`}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {organizations.length === 0 && (
                <div className="text-center py-12">
                    <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Nenhuma organização cadastrada</p>
                    <button onClick={handleCreate} className="text-indigo-600 hover:text-indigo-700 font-medium">
                        Criar primeira organização
                    </button>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 bg-slate-900/30 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => { setShowModal(false); setEditingOrg(null); }}
                >
                    <div
                        className="bg-white dark:bg-[#12121d] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                {editingOrg ? 'Editar Cliente' : 'Adicionar Cliente'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Basic Info */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Informações Básicas</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome *</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                placeholder="Ex: Empresa XPTO"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Slug *</label>
                                            <input
                                                type="text"
                                                value={formData.slug}
                                                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                                required
                                                disabled={!!editingOrg}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800"
                                                placeholder="empresa-xpto"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                placeholder="contato@empresa.com"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Telefone</label>
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                placeholder="11999999999"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* API Keys */}
                                <div className="border-t dark:border-gray-800 pt-6">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Chaves de API</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                OpenAI API Key
                                                <span className="text-gray-500 dark:text-gray-400 font-normal ml-2">(opcional)</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showOpenAI ? 'text' : 'password'}
                                                    value={formData.openaiApiKey}
                                                    onChange={(e) => setFormData({ ...formData, openaiApiKey: e.target.value })}
                                                    className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                    placeholder="sk-..."
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowOpenAI(!showOpenAI)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                                >
                                                    {showOpenAI ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Obtenha em: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">platform.openai.com/api-keys</a>
                                            </p>
                                        </div>
                                        {/* <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                OPENAI_ADMIN_KEY
                                                <span className="text-gray-500 font-normal ml-2">(opcional)</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showOpenAI ? 'text' : 'password'}
                                                    value={formData.openaiAdminKey}
                                                    onChange={(e) => setFormData({ ...formData, openaiAdminKey: e.target.value })}
                                                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                    placeholder="sk-..."
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowOpenAI(!showOpenAI)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                >
                                                    {showOpenAI ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Obtenha em: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">platform.openai.com/api-keys</a>
                                            </p>
                                        </div> */}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                OpenAI Project ID
                                                <span className="text-gray-500 dark:text-gray-400 font-normal ml-2">(para custos)</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.openaiProjectId}
                                                onChange={(e) => setFormData({ ...formData, openaiProjectId: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                placeholder="proj_xxxxxxxx"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Obtenha em: <a href="https://platform.openai.com/settings/organization/projects" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">platform.openai.com/settings/organization/projects</a>
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                ElevenLabs API Key
                                                <span className="text-gray-500 dark:text-gray-400 font-normal ml-2">(opcional)</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showElevenLabs ? 'text' : 'password'}
                                                    value={formData.elevenLabsApiKey}
                                                    onChange={(e) => setFormData({ ...formData, elevenLabsApiKey: e.target.value })}
                                                    className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                    placeholder="..."
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowElevenLabs(!showElevenLabs)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                                >
                                                    {showElevenLabs ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Obtenha em: <a href="https://elevenlabs.io/app/settings/api-keys" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">elevenlabs.io/app/settings/api-keys</a>
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                ElevenLabs Voice ID
                                                <span className="text-gray-500 dark:text-gray-400 font-normal ml-2">(opcional)</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.elevenLabsVoiceId}
                                                onChange={(e) => setFormData({ ...formData, elevenLabsVoiceId: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                placeholder="21m00Tcm4TlvDq8ikWAM (Rachel)"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Encontre em: <a href="https://elevenlabs.io/app/voice-library" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">elevenlabs.io/app/voice-library</a>
                                            </p>
                                        </div>

                                        {/* Evolution API */}
                                        <div className="border-t dark:border-gray-800 pt-4">
                                            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Evolution API (WhatsApp)</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        URL da API
                                                        <span className="text-gray-500 dark:text-gray-400 font-normal ml-2">(opcional)</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.evolutionApiUrl}
                                                        onChange={(e) => setFormData({ ...formData, evolutionApiUrl: e.target.value })}
                                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                        placeholder="http://34.151.240.107:4000"
                                                    />
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        A chave de API é configurada globalmente no arquivo .env (EVOLUTION_API_KEY)
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Nome da Instância
                                                        <span className="text-gray-500 dark:text-gray-400 font-normal ml-2">(opcional)</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.evolutionInstanceName}
                                                        onChange={(e) => setFormData({ ...formData, evolutionInstanceName: e.target.value })}
                                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                        placeholder="minha-instancia"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* ZapSign */}
                                        <div className="border-t dark:border-gray-800 pt-4">
                                            <h4 className="font-medium text-gray-900 dark:text-white mb-3">ZapSign (Assinatura Digital)</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        API Token
                                                        <span className="text-gray-500 dark:text-gray-400 font-normal ml-2">(opcional)</span>
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type={showZapSign ? 'text' : 'password'}
                                                            value={formData.zapSignApiToken}
                                                            onChange={(e) => setFormData({ ...formData, zapSignApiToken: e.target.value })}
                                                            className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                            placeholder="..."
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowZapSign(!showZapSign)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                                        >
                                                            {showZapSign ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        Obtenha em: <a href="https://app.zapsign.com.br/configuracoes/api" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">app.zapsign.com.br/configuracoes/api</a>
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Template ID Padrão
                                                        <span className="text-gray-500 dark:text-gray-400 font-normal ml-2">(opcional)</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.zapSignTemplateId}
                                                        onChange={(e) => setFormData({ ...formData, zapSignTemplateId: e.target.value })}
                                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                        placeholder="ID do template de contrato"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-4 border-t dark:border-gray-800">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                                    >
                                        {editingOrg ? 'Atualizar' : 'Criar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
