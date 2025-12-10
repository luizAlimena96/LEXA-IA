import { useState } from "react";
import { Plus, Edit, Trash2, GitBranch, ArrowRight } from "lucide-react";
import { AgentState } from "../../services/agentService";
import SearchInput from "../../components/SearchInput";

interface StatesTabProps {
    items: AgentState[];
    onCreate: () => void;
    onEdit: (item: AgentState) => void;
    onDelete: (id: string) => void;
}

export default function StatesTab({
    items,
    onCreate,
    onEdit,
    onDelete,
}: StatesTabProps) {
    const [searchTerm, setSearchTerm] = useState("");

    // Filter and sort by order
    const filteredItems = items.filter((item) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            item.name.toLowerCase().includes(term) ||
            item.missionPrompt.toLowerCase().includes(term) ||
            (item.dataKey && item.dataKey.toLowerCase().includes(term))
        );
    });
    const sortedItems = [...filteredItems].sort((a, b) => a.order - b.order);

    const getRouteCount = (routes: any) => {
        if (!routes) return 0;
        const success = routes.rota_de_sucesso?.length || 0;
        const persistence = routes.rota_de_persistencia?.length || 0;
        const escape = routes.rota_de_escape?.length || 0;
        return success + persistence + escape;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Estados (FSM)</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Gerencie os estados da máquina de estados finitos e suas rotas de transição
                    </p>
                </div>
                <button
                    onClick={onCreate}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                >
                    <Plus className="w-5 h-5" />
                    Novo Estado
                </button>
            </div>

            {/* Search Bar */}
            <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Pesquisar estados por nome, missão..."
                className="max-w-md"
            />

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-3">
                    <GitBranch className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900 dark:text-blue-100">
                        <p className="font-medium mb-1">Como funcionam os Estados?</p>
                        <p className="text-blue-700 dark:text-blue-300">
                            Cada estado representa um estágio da conversa. As <strong>rotas</strong> definem
                            para onde a conversa pode ir: <strong>sucesso</strong> (missão cumprida),
                            <strong>persistência</strong> (insistir), ou <strong>escape</strong> (sair/escalar).
                        </p>
                    </div>
                </div>
            </div>

            {/* States List */}
            {sortedItems.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <GitBranch className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Nenhum estado configurado
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Crie seu primeiro estado para começar a estruturar o fluxo de conversas
                    </p>
                    <button
                        onClick={onCreate}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        Criar Primeiro Estado
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {sortedItems.map((state, index) => {
                        const routeCount = getRouteCount(state.availableRoutes);
                        const routes = state.availableRoutes as any;

                        return (
                            <div
                                key={state.id}
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-lg font-bold text-lg">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                                {state.name}
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                                                {state.missionPrompt}
                                            </p>

                                            {/* Data Collection Info */}
                                            {state.dataKey && (
                                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                                                    <span className="font-medium">Coleta:</span>
                                                    <code className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                                        {state.dataKey}
                                                    </code>
                                                    {state.dataType && (
                                                        <span className="text-gray-400 dark:text-gray-500">
                                                            ({state.dataType})
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Routes Summary */}
                                            <div className="flex flex-wrap gap-2">
                                                {routes?.rota_de_sucesso?.length > 0 && (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                        {routes.rota_de_sucesso.length} sucesso
                                                    </div>
                                                )}
                                                {routes?.rota_de_persistencia?.length > 0 && (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium">
                                                        <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                                        {routes.rota_de_persistencia.length} persistência
                                                    </div>
                                                )}
                                                {routes?.rota_de_escape?.length > 0 && (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">
                                                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                                        {routes.rota_de_escape.length} escape
                                                    </div>
                                                )}
                                                {routeCount === 0 && (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium">
                                                        Sem rotas configuradas
                                                    </div>
                                                )}
                                            </div>

                                            {/* Route Details */}
                                            {routeCount > 0 && (
                                                <div className="mt-3 space-y-2">
                                                    {routes?.rota_de_sucesso?.map((route: any, idx: number) => (
                                                        <div key={idx} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                                            <ArrowRight className="w-3 h-3 text-green-500" />
                                                            <span className="font-medium text-green-700">Sucesso:</span>
                                                            <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                                                                {route.estado}
                                                            </code>
                                                            <span className="text-gray-500 dark:text-gray-400">- {route.descricao}</span>
                                                        </div>
                                                    ))}
                                                    {routes?.rota_de_persistencia?.map((route: any, idx: number) => (
                                                        <div key={idx} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                                            <ArrowRight className="w-3 h-3 text-yellow-500" />
                                                            <span className="font-medium text-yellow-700">Persistência:</span>
                                                            <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                                                                {route.estado}
                                                            </code>
                                                            <span className="text-gray-500 dark:text-gray-400">- {route.descricao}</span>
                                                        </div>
                                                    ))}
                                                    {routes?.rota_de_escape?.map((route: any, idx: number) => (
                                                        <div key={idx} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                                            <ArrowRight className="w-3 h-3 text-red-500" />
                                                            <span className="font-medium text-red-700">Escape:</span>
                                                            <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                                                                {route.estado}
                                                            </code>
                                                            <span className="text-gray-500 dark:text-gray-400">- {route.descricao}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 ml-4">
                                        <button
                                            onClick={() => onEdit(state)}
                                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => onDelete(state.id)}
                                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
