"use client";

import { useState, useEffect } from "react";
import { X, Plus, Pencil, Trash2, Search, FileText, Mic, Image, Loader2, Upload } from "lucide-react";
import Modal from "../Modal";
import type { QuickResponse, CreateQuickResponseData } from "@/app/services/quickResponseService";
import { fileToDataUrl } from "@/app/services/quickResponseService";

interface QuickResponseModalProps {
    isOpen: boolean;
    onClose: () => void;
    quickResponses: QuickResponse[];
    onCreateResponse: (data: CreateQuickResponseData) => Promise<void>;
    onUpdateResponse: (id: string, data: Partial<CreateQuickResponseData>) => Promise<void>;
    onDeleteResponse: (id: string) => Promise<void>;
    organizationId?: string;
}

type ResponseType = 'TEXT' | 'AUDIO' | 'IMAGE';

export default function QuickResponseModal({
    isOpen,
    onClose,
    quickResponses,
    onCreateResponse,
    onUpdateResponse,
    onDeleteResponse,
    organizationId,
}: QuickResponseModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Form state
    const [formName, setFormName] = useState("");
    const [formType, setFormType] = useState<ResponseType>("TEXT");
    const [formContent, setFormContent] = useState("");

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormName("");
        setFormType("TEXT");
        setFormContent("");
        setDeleteConfirmId(null);
    };

    const handleEdit = (response: QuickResponse) => {
        setEditingId(response.id);
        setFormName(response.name);
        setFormType(response.type);
        setFormContent(response.content);
        setShowForm(true);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (formType === 'AUDIO' && !file.type.startsWith('audio/')) {
            alert('Por favor, selecione um arquivo de áudio válido');
            return;
        }
        if (formType === 'IMAGE' && !file.type.startsWith('image/')) {
            alert('Por favor, selecione uma imagem válida');
            return;
        }

        // Check file size (max 5MB for images, 10MB for audio)
        const maxSize = formType === 'AUDIO' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
        if (file.size > maxSize) {
            alert(`Arquivo muito grande. Máximo: ${formType === 'AUDIO' ? '10MB' : '5MB'}`);
            return;
        }

        try {
            const dataUrl = await fileToDataUrl(file);
            setFormContent(dataUrl);
        } catch (error) {
            console.error('Error converting file:', error);
            alert('Erro ao processar arquivo');
        }
    };

    const handleSubmit = async () => {
        if (!formName.trim() || !formContent.trim()) {
            alert('Por favor, preencha todos os campos');
            return;
        }

        setIsLoading(true);
        try {
            if (editingId) {
                await onUpdateResponse(editingId, {
                    name: formName,
                    type: formType,
                    content: formContent,
                });
            } else {
                await onCreateResponse({
                    name: formName,
                    type: formType,
                    content: formContent,
                    organizationId,
                });
            }
            resetForm();
        } catch (error) {
            console.error('Error saving quick response:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        setIsLoading(true);
        try {
            await onDeleteResponse(id);
            setDeleteConfirmId(null);
        } catch (error) {
            console.error('Error deleting quick response:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredResponses = quickResponses.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getTypeIcon = (type: ResponseType) => {
        switch (type) {
            case 'TEXT': return <FileText className="w-4 h-4" />;
            case 'AUDIO': return <Mic className="w-4 h-4" />;
            case 'IMAGE': return <Image className="w-4 h-4" />;
        }
    };

    const getTypeLabel = (type: ResponseType) => {
        switch (type) {
            case 'TEXT': return 'Texto';
            case 'AUDIO': return 'Áudio';
            case 'IMAGE': return 'Imagem';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Respostas Rápidas" size="lg">
            <div className="space-y-4">
                {/* Search and Add Button */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar respostas..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-100 dark:bg-[#1a1a28] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                        />
                    </div>
                    <button
                        onClick={() => {
                            resetForm();
                            setShowForm(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        Nova Resposta
                    </button>
                </div>

                {/* Form for Create/Edit */}
                {showForm && (
                    <div className="bg-gray-50 dark:bg-[#1a1a28] border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                            {editingId ? 'Editar Resposta' : 'Nova Resposta'}
                        </h3>

                        {/* Name Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nome
                            </label>
                            <input
                                type="text"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                placeholder="Ex: Saudação, Agradecimento..."
                                className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0f0f18] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                            />
                        </div>

                        {/* Type Selector */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Tipo
                            </label>
                            <div className="flex gap-2">
                                {(['TEXT', 'AUDIO', 'IMAGE'] as ResponseType[]).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            setFormType(type);
                                            setFormContent(""); // Reset content when type changes
                                        }}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors text-sm ${formType === type
                                                ? 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                                                : 'bg-white dark:bg-[#0f0f18] border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        {getTypeIcon(type)}
                                        {getTypeLabel(type)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {formType === 'TEXT' ? 'Conteúdo' : 'Arquivo ou URL'}
                            </label>

                            {formType === 'TEXT' ? (
                                <textarea
                                    value={formContent}
                                    onChange={(e) => setFormContent(e.target.value)}
                                    placeholder="Digite o texto da resposta..."
                                    rows={4}
                                    className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0f0f18] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white resize-none"
                                />
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={formContent.startsWith('data:') ? '(Arquivo carregado)' : formContent}
                                            onChange={(e) => setFormContent(e.target.value)}
                                            placeholder={`Cole a URL ${formType === 'AUDIO' ? 'do áudio' : 'da imagem'}...`}
                                            className="flex-1 px-3 py-2 text-sm bg-white dark:bg-[#0f0f18] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                                            readOnly={formContent.startsWith('data:')}
                                        />
                                        <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer transition-colors">
                                            <Upload className="w-4 h-4" />
                                            <span className="text-sm">Upload</span>
                                            <input
                                                type="file"
                                                accept={formType === 'AUDIO' ? 'audio/*' : 'image/*'}
                                                onChange={handleFileUpload}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>

                                    {/* Preview */}
                                    {formContent && (
                                        <div className="mt-2 p-2 bg-white dark:bg-[#0f0f18] rounded-lg border border-gray-200 dark:border-gray-700">
                                            {formType === 'IMAGE' && (
                                                <img
                                                    src={formContent}
                                                    alt="Preview"
                                                    className="max-h-32 rounded object-contain"
                                                />
                                            )}
                                            {formType === 'AUDIO' && (
                                                <audio controls src={formContent} className="w-full h-10" />
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={resetForm}
                                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                {editingId ? 'Salvar Alterações' : 'Criar Resposta'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Responses List */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {filteredResponses.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            {searchQuery ? 'Nenhuma resposta encontrada' : 'Nenhuma resposta rápida criada ainda'}
                        </div>
                    ) : (
                        filteredResponses.map(response => (
                            <div
                                key={response.id}
                                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#1a1a28] border border-gray-200 dark:border-gray-700 rounded-lg group"
                            >
                                {/* Type Icon */}
                                <div className={`p-2 rounded-lg ${response.type === 'TEXT' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                                        response.type === 'AUDIO' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                                            'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                    }`}>
                                    {getTypeIcon(response.type)}
                                </div>

                                {/* Name and Preview */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                        {response.name}
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                        {response.type === 'TEXT'
                                            ? response.content.slice(0, 50) + (response.content.length > 50 ? '...' : '')
                                            : getTypeLabel(response.type)
                                        }
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(response)}
                                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        title="Editar"
                                    >
                                        <Pencil className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    </button>

                                    {deleteConfirmId === response.id ? (
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleDelete(response.id)}
                                                disabled={isLoading}
                                                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                                            >
                                                Confirmar
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirmId(null)}
                                                className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setDeleteConfirmId(response.id)}
                                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Modal>
    );
}
