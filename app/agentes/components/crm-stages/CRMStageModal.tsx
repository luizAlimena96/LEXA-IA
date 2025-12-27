'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { CRMStage, State, StageFormData } from '../interfaces';

const DEFAULT_COLORS = [
    '#6366f1', '#3b82f6', '#10b981', '#f59e0b',
    '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
];

interface CRMStageModalProps {
    stage: CRMStage | null;
    availableStates: State[];
    onSave: (data: StageFormData) => void;
    onClose: () => void;
    stages: CRMStage[];
    error?: string | null;
    saving: boolean;
}

export default function CRMStageModal({
    stage,
    availableStates,
    onSave,
    onClose,
    stages,
    error,
    saving,
}: CRMStageModalProps) {
    const [formData, setFormData] = useState<StageFormData>({
        name: '',
        description: '',
        color: DEFAULT_COLORS[0],
        stateIds: [],
    });

    useEffect(() => {
        if (stage) {
            setFormData({
                name: stage.name,
                description: stage.description || '',
                color: stage.color,
                stateIds: stage.states?.map((s) => s.id) || [],
            });
        }
    }, [stage]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const toggleState = (stateId: string) => {
        setFormData((prev) => ({
            ...prev,
            stateIds: prev.stateIds.includes(stateId)
                ? prev.stateIds.filter((id) => id !== stateId)
                : [...prev.stateIds, stateId],
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {stage ? 'Editar' : 'Nova'} Etapa do CRM
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2 text-red-700 dark:text-red-400">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nome da Etapa *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            required
                            placeholder="Ex: Novo Lead, Em Negociação, Fechado..."
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Descrição
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Descreva o que representa esta etapa..."
                        />
                    </div>

                    {/* Color */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Cor *
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {DEFAULT_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, color })}
                                    className={`w-10 h-10 rounded-lg border-2 transition-all ${formData.color === color
                                        ? 'border-gray-900 dark:border-white scale-110'
                                        : 'border-transparent hover:scale-105'
                                        }`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>

                    {/* States */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Estados Associados
                        </label>
                        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-h-60 overflow-y-auto">
                            {availableStates.length === 0 ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                    Nenhum estado disponível
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {availableStates.map((state) => {
                                        const isAssignedToOther = state.crmStageId && state.crmStageId !== stage?.id;
                                        return (
                                            <label
                                                key={state.id}
                                                className={`flex items-center gap-3 p-2 rounded transition-colors ${isAssignedToOther
                                                        ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800'
                                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.stateIds.includes(state.id)}
                                                    onChange={() => !isAssignedToOther && toggleState(state.id)}
                                                    disabled={!!isAssignedToOther}
                                                    className="w-4 h-4 disabled:opacity-50"
                                                />
                                                <span className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                                    {state.name}
                                                    {isAssignedToOther && (
                                                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                                                            {stages.find(s => s.id === state.crmStageId)?.name}
                                                        </span>
                                                    )}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving || !formData.name}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                    >
                        {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
