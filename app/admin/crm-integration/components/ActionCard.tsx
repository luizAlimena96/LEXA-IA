import { WorkflowAction } from './types';
import { Settings, Trash2, ChevronUp, ChevronDown, Database, Send } from 'lucide-react';

interface ActionCardProps {
    action: WorkflowAction;
    index: number;
    totalActions: number;
    onEdit: () => void;
    onDelete: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    availableVariables: string[];
}

export default function ActionCard({
    action,
    index,
    totalActions,
    onEdit,
    onDelete,
    onMoveUp,
    onMoveDown,
    availableVariables,
}: ActionCardProps) {
    // Extract variables used in this action
    const variablesUsed = new Set<string>();
    const variableRegex = /\{\{([^}]+)\}\}/g;

    [action.url, action.bodyTemplate].forEach((text) => {
        if (text) {
            let match;
            while ((match = variableRegex.exec(text)) !== null) {
                const varName = match[1].trim().split('.')[0];
                variablesUsed.add(varName);
            }
        }
    });

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
            <div className="flex items-start gap-4">
                {/* Order Badge */}
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                            {action.order}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                {action.name}
                            </h4>
                            {action.actionType === 'SEND_MESSAGE' ? (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
                                    <Send className="w-3 h-3" />
                                    Enviar Mensagem WhatsApp
                                </p>
                            ) : (
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-mono mt-1">
                                    {action.method} {action.url.length > 50 ? action.url.substring(0, 50) + '...' : action.url}
                                </p>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1">
                            {index > 0 && (
                                <button
                                    onClick={onMoveUp}
                                    className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                    title="Mover para cima"
                                >
                                    <ChevronUp className="w-4 h-4" />
                                </button>
                            )}
                            {index < totalActions - 1 && (
                                <button
                                    onClick={onMoveDown}
                                    className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                    title="Mover para baixo"
                                >
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={onEdit}
                                className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                title="Editar"
                            >
                                <Settings className="w-4 h-4" />
                            </button>
                            <button
                                onClick={onDelete}
                                className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                title="Deletar"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mt-2">
                        {/* Save Response Badge */}
                        {action.saveResponseAs && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-medium">
                                <Database className="w-3 h-3" />
                                Salva como: {action.saveResponseAs}
                            </span>
                        )}

                        {/* Variables Used */}
                        {variablesUsed.size > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                                📥 Usa: {Array.from(variablesUsed).join(', ')}
                            </span>
                        )}

                        {/* Continue on Error */}
                        {action.continueOnError && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded text-xs font-medium">
                                ⚠️ Continua em erro
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
