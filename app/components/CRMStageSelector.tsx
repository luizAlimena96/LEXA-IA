'use client';

import { useState, useEffect } from 'react';
import { Loader2, TrendingUp } from 'lucide-react';
import api from '@/app/lib/api-client';

interface CRMStage {
    id: string;
    name: string;
    description?: string | null;
    color: string;
    order: number;
    states?: Array<{
        id: string;
        name: string;
    }>;
}

interface CRMStageSelectorProps {
    agentId: string;
    value: string | null;
    onChange: (stageId: string | null) => void;
    label?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    showStates?: boolean;
    className?: string;
}

export default function CRMStageSelector({
    agentId,
    value,
    onChange,
    label = 'Etapa do CRM',
    placeholder = 'Selecione uma etapa...',
    required = false,
    disabled = false,
    showStates = false,
    className = '',
}: CRMStageSelectorProps) {
    const [stages, setStages] = useState<CRMStage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (agentId) {
            loadStages();
        }
    }, [agentId]);

    const loadStages = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.agents.crmStages.list(agentId);
            setStages(data);
        } catch (err) {
            console.error('Error loading CRM stages:', err);
            setError('Não foi possível carregar as etapas');
        } finally {
            setLoading(false);
        }
    };

    const selectedStage = stages.find((s) => s.id === value);

    if (loading) {
        return (
            <div className={className}>
                {label && (
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Carregando etapas...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={className}>
                {label && (
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                <div className="px-4 py-2 border border-red-300 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
                    {error}
                </div>
            </div>
        );
    }

    if (stages.length === 0) {
        return (
            <div className={className}>
                {label && (
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                <div className="px-4 py-2 border border-yellow-300 dark:border-yellow-800 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-200 text-sm">
                    Nenhuma etapa criada. Crie etapas na aba "Etapas CRM".
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                <select
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value || null)}
                    disabled={disabled}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed appearance-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                    <option value="">{placeholder}</option>
                    {stages.map((stage) => (
                        <option key={stage.id} value={stage.id}>
                            {stage.name}
                            {stage.states && stage.states.length > 0 && showStates
                                ? ` (${stage.states.length} estados)`
                                : ''}
                        </option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <TrendingUp className="h-4 w-4 text-gray-400" />
                </div>
            </div>

            {/* Show selected stage info */}
            {selectedStage && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: selectedStage.color }}
                    />
                    <span className="text-gray-600 dark:text-gray-400">
                        {selectedStage.description || selectedStage.name}
                    </span>
                </div>
            )}

            {/* Show states if enabled */}
            {selectedStage && showStates && selectedStage.states && selectedStage.states.length > 0 && (
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Estados nesta etapa:
                    </p>
                    <div className="flex flex-wrap gap-1">
                        {selectedStage.states.map((state) => (
                            <span
                                key={state.id}
                                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                            >
                                {state.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
