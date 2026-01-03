'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FileText, Loader2, X, Save, Upload } from 'lucide-react';
import api from '@/app/lib/api-client';

interface KnowledgeItem {
    id: string;
    title: string;
    content: string;
    type: 'TEXT' | 'FAQ' | 'DOCUMENT';
    createdAt: string;
}

interface TemplateKnowledgeEditorProps {
    templateId: string;
    onUpdate: () => void;
}

export default function TemplateKnowledgeEditor({ templateId, onUpdate }: TemplateKnowledgeEditorProps) {
    const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadTitle, setUploadTitle] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'TEXT' as 'TEXT' | 'FAQ' | 'DOCUMENT',
    });

    useEffect(() => {
        loadKnowledge();
    }, [templateId]);

    const loadKnowledge = async () => {
        try {
            setLoading(true);
            const data = await api.get(`/agent-templates/${templateId}/knowledge`) as KnowledgeItem[];
            setKnowledge(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Erro ao carregar knowledge:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingItem(null);
        setFormData({ title: '', content: '', type: 'TEXT' });
        setShowModal(true);
    };

    const handleEdit = (item: KnowledgeItem) => {
        setEditingItem(item);
        setFormData({
            title: item.title,
            content: item.content,
            type: item.type,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            if (editingItem) {
                await api.put(`/agent-templates/${templateId}/knowledge/${editingItem.id}`, formData);
            } else {
                await api.post(`/agent-templates/${templateId}/knowledge`, formData);
            }
            setShowModal(false);
            loadKnowledge();
            onUpdate();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Erro ao salvar knowledge');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente excluir este item de conhecimento?')) return;

        try {
            await api.delete(`/agent-templates/${templateId}/knowledge/${id}`);
            loadKnowledge();
            onUpdate();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Erro ao excluir knowledge');
        }
    };

    const handleUpload = async () => {
        if (!uploadFile || !uploadTitle.trim()) {
            alert('Preencha todos os campos');
            return;
        }

        setIsUploading(true);
        setShowUploadModal(false);

        try {
            const formData = new FormData();
            formData.append('file', uploadFile);
            formData.append('title', uploadTitle);

            const response = await api.post(`/agent-templates/${templateId}/knowledge/upload`, formData) as any;
            const newItem = response.knowledge || response;

            setKnowledge([...knowledge, newItem]);
            setUploadFile(null);
            setUploadTitle('');
            alert('Arquivo enviado e processado com sucesso!');
            onUpdate();
        } catch (err: any) {
            alert(err.message || 'Erro ao enviar arquivo');
        } finally {
            setIsUploading(false);
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Base de Conhecimento</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Gerencie o conhecimento que será usado pelo agente
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                    >
                        <Upload className="w-5 h-5" />
                        Upload Documento
                    </button>
                    <button
                        onClick={handleCreate}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        Novo Conhecimento
                    </button>
                </div>
            </div>

            {isUploading && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        <span className="text-blue-900 dark:text-blue-100">
                            Processando documento... Isso pode levar alguns segundos.
                        </span>
                    </div>
                </div>
            )}

            {knowledge.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Nenhum conhecimento cadastrado
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Adicione conhecimento para que o agente possa responder melhor
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                        >
                            <Upload className="w-5 h-5" />
                            Upload Documento
                        </button>
                        <button
                            onClick={handleCreate}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            Criar Primeiro Conhecimento
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {knowledge.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {item.title}
                                        </h3>
                                        <span className="px-2 py-1 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded">
                                            {item.type}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                                        {item.content}
                                    </p>
                                </div>
                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                        title="Editar"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Upload de Documento
                            </h3>
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Título *
                                </label>
                                <input
                                    type="text"
                                    value={uploadTitle}
                                    onChange={(e) => setUploadTitle(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Ex: Manual do Produto"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Arquivo *
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf,.txt,.doc,.docx"
                                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Formatos aceitos: PDF, TXT, DOC, DOCX
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={!uploadFile || !uploadTitle.trim()}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
                            >
                                <Upload className="w-4 h-4" />
                                Upload
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit/Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingItem ? 'Editar Conhecimento' : 'Novo Conhecimento'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Título *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Ex: Política de Devolução"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Tipo
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="TEXT">Texto</option>
                                    <option value="FAQ">FAQ</option>
                                    <option value="DOCUMENT">Documento</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Conteúdo *
                                </label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    rows={10}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                    placeholder="Digite o conteúdo do conhecimento..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!formData.title || !formData.content}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
                            >
                                <Save className="w-4 h-4" />
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
