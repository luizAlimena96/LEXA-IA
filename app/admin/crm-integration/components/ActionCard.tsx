import { Edit2, Trash2, ChevronUp, ChevronDown, Database } from 'lucide-react';
import { WorkflowAction, ActionCardProps } from './interfaces';

export default function ActionCard({
    action,
    index,
    onEdit,
    onDelete,
    onMoveUp,
    onMoveDown,
    availableVariables,
}: ActionCardProps) {
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
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                            {action.order}
                        </span>
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                {action.name}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-mono mt-1">
                                {action.method} {action.url.length > 50 ? action.url.substring(0, 50) + '...' : action.url}
                            </p>
                        </div>

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
                            <button
                                onClick={onMoveDown}
                                className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                title="Mover para baixo"
                            >
                                <ChevronDown className="w-4 h-4" />
                            </button>
                            <button
                                onClick={onEdit}
                                className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                title="Editar"
                            >
                                <Edit2 className="w-4 h-4" />
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

                    <div className="flex flex-wrap gap-2 mt-2">
                        {action.saveResponseAs && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-medium">
                                <Database className="w-3 h-3" />
                                Salva como: {action.saveResponseAs}
                            </span>
                        )}

                        {variablesUsed.size > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                                📥 Usa: {Array.from(variablesUsed).join(', ')}
                            </span>
                        )}

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
