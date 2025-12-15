import ActionCard from './ActionCard';
import { Plus, ArrowDown } from 'lucide-react';
import { getAvailableVariables } from '../utils/crmWorkflowUtils';
import { WorkflowAction, WorkflowCanvasProps } from './interfaces';

export default function WorkflowCanvas({
    actions,
    onEditAction,
    onDeleteAction,
    onMoveAction,
    onAddAction,
}: WorkflowCanvasProps) {
    const sortedActions = [...actions].sort((a, b) => a.order - b.order);

    const handleMoveUp = (index: number) => {
        if (index > 0) {
            onMoveAction(index, index - 1);
        }
    };

    const handleMoveDown = (index: number) => {
        if (index < sortedActions.length - 1) {
            onMoveAction(index, index + 1);
        }
    };

    return (
        <div className="space-y-3">
            {sortedActions.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Nenhuma ação configurada
                    </p>
                    <button
                        onClick={() => onAddAction()}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Adicionar Primeira Ação
                    </button>
                </div>
            ) : (
                <>
                    {sortedActions.map((action, index) => (
                        <div key={action.id}>
                            <ActionCard
                                action={action}
                                index={index}
                                onEdit={() => onEditAction(action, index)}
                                onDelete={() => onDeleteAction(index)}
                                onMoveUp={() => handleMoveUp(index)}
                                onMoveDown={() => handleMoveDown(index)}
                                availableVariables={getAvailableVariables(sortedActions, action.order)}
                            />

                            {index < sortedActions.length - 1 && (
                                <div className="flex items-center justify-center py-2">
                                    <div className="flex items-center gap-2">
                                        <ArrowDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                        <button
                                            onClick={() => onAddAction(index)}
                                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" />
                                            Adicionar ação
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    <div className="flex items-center justify-center pt-2">
                        <button
                            onClick={() => onAddAction(sortedActions.length - 1)}
                            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Adicionar Ação
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
