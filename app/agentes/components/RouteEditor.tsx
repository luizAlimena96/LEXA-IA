import { Plus, X, Trash2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import type { Route, AvailableRoutes } from "../../services/agentService";

interface RouteEditorProps {
    routes: AvailableRoutes;
    onChange: (routes: AvailableRoutes) => void;
    availableStates: string[];
    // Custom states created by user in this session
    customStates?: string[];
    onCustomStatesChange?: (states: string[]) => void;
}

export default function RouteEditor({
    routes,
    onChange,
    availableStates,
    customStates = [],
    onCustomStatesChange
}: RouteEditorProps) {
    // Track which route is currently in "creating new state" mode
    const [creatingNewState, setCreatingNewState] = useState<{ [key: string]: boolean }>({});

    // Combine existing states with custom states for the dropdown
    const allAvailableStates = useMemo(() => {
        // Merge and deduplicate, keeping order: existing first, then custom
        const combined = [...availableStates];
        customStates.forEach(state => {
            if (!combined.includes(state)) {
                combined.push(state);
            }
        });
        return combined;
    }, [availableStates, customStates]);

    const addRoute = (type: 'rota_de_sucesso' | 'rota_de_persistencia' | 'rota_de_escape') => {
        onChange({
            ...routes,
            [type]: [...(routes[type] || []), { estado: '', descricao: '' }]
        });
    };

    const removeRoute = (type: 'rota_de_sucesso' | 'rota_de_persistencia' | 'rota_de_escape', index: number) => {
        const key = `${type}-${index}`;
        const newCreatingState = { ...creatingNewState };
        delete newCreatingState[key];
        setCreatingNewState(newCreatingState);

        onChange({
            ...routes,
            [type]: (routes[type] || []).filter((_, i) => i !== index)
        });
    };

    const updateRoute = (
        type: 'rota_de_sucesso' | 'rota_de_persistencia' | 'rota_de_escape',
        index: number,
        field: 'estado' | 'descricao',
        value: string
    ) => {
        const newRoutes = [...(routes[type] || [])];
        newRoutes[index] = { ...newRoutes[index], [field]: value };
        onChange({
            ...routes,
            [type]: newRoutes
        });
    };

    const handleStateSelection = (
        type: 'rota_de_sucesso' | 'rota_de_persistencia' | 'rota_de_escape',
        index: number,
        value: string
    ) => {
        const key = `${type}-${index}`;

        if (value === '__CREATE_NEW__') {
            setCreatingNewState({ ...creatingNewState, [key]: true });
            updateRoute(type, index, 'estado', '');
        } else {
            setCreatingNewState({ ...creatingNewState, [key]: false });
            updateRoute(type, index, 'estado', value);
        }
    };

    const handleConfirmNewState = (
        type: 'rota_de_sucesso' | 'rota_de_persistencia' | 'rota_de_escape',
        index: number,
        stateName: string
    ) => {
        const key = `${type}-${index}`;
        const trimmedName = stateName.trim().toUpperCase().replace(/\s+/g, '_');

        if (trimmedName) {
            // Add to global custom states if not already there
            if (!customStates.includes(trimmedName) && !availableStates.includes(trimmedName)) {
                onCustomStatesChange?.([...customStates, trimmedName]);
            }
            // Update route with the formatted name
            updateRoute(type, index, 'estado', trimmedName);
            setCreatingNewState({ ...creatingNewState, [key]: false });
        }
    };

    const handleDeleteCustomState = (stateName: string) => {
        // Remove from custom states list
        onCustomStatesChange?.(customStates.filter(s => s !== stateName));

        // Clear any routes that were using this state
        const newRoutes = {
            rota_de_sucesso: (routes.rota_de_sucesso || []).map(r =>
                r.estado === stateName ? { ...r, estado: '' } : r
            ),
            rota_de_persistencia: (routes.rota_de_persistencia || []).map(r =>
                r.estado === stateName ? { ...r, estado: '' } : r
            ),
            rota_de_escape: (routes.rota_de_escape || []).map(r =>
                r.estado === stateName ? { ...r, estado: '' } : r
            )
        };
        onChange(newRoutes);
    };

    const isCustomState = (stateName: string) => {
        return customStates.includes(stateName) && !availableStates.includes(stateName);
    };

    const renderRouteSection = (
        type: 'rota_de_sucesso' | 'rota_de_persistencia' | 'rota_de_escape',
        title: string,
        color: 'green' | 'yellow' | 'red',
        description: string
    ) => {
        const colorClasses = {
            green: {
                bg: 'bg-green-50 dark:bg-green-900/20',
                border: 'border-green-200 dark:border-green-800',
                text: 'text-green-700 dark:text-green-300',
                button: 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600'
            },
            yellow: {
                bg: 'bg-yellow-50 dark:bg-yellow-900/20',
                border: 'border-yellow-200 dark:border-yellow-800',
                text: 'text-yellow-700 dark:text-yellow-300',
                button: 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-600'
            },
            red: {
                bg: 'bg-red-50 dark:bg-red-900/20',
                border: 'border-red-200 dark:border-red-800',
                text: 'text-red-700 dark:text-red-300',
                button: 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600'
            }
        }[color];


        return (
            <div className={`border ${colorClasses.border} ${colorClasses.bg} rounded-lg p-4`}>
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h4 className={`font-semibold ${colorClasses.text}`}>{title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{description}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => addRoute(type)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 ${colorClasses.button} text-white rounded-lg transition-colors text-sm font-medium`}
                    >
                        <Plus className="w-4 h-4" />
                        Adicionar
                    </button>
                </div>

                <div className="space-y-3">
                    {(!routes[type] || routes[type].length === 0) ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">Nenhuma rota configurada</p>
                    ) : (
                        routes[type].map((route, index) => {
                            const key = `${type}-${index}`;
                            const isCreatingNew = creatingNewState[key];

                            return (
                                <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                                    <div className="flex gap-3">
                                        <div className="flex-1 space-y-2">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Estado Destino *
                                                </label>
                                                {isCreatingNew ? (
                                                    <div className="space-y-2">
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={route.estado}
                                                                onChange={(e) => updateRoute(type, index, 'estado', e.target.value)}
                                                                placeholder="Nome do novo estado"
                                                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                                                autoFocus
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        handleConfirmNewState(type, index, route.estado);
                                                                    }
                                                                }}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleConfirmNewState(type, index, route.estado)}
                                                                className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                                                                title="Confirmar"
                                                            >
                                                                OK
                                                            </button>
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            O nome será formatado automaticamente (MAIÚSCULAS_COM_UNDERSCORES)
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setCreatingNewState({ ...creatingNewState, [key]: false });
                                                                updateRoute(type, index, 'estado', '');
                                                            }}
                                                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                                                        >
                                                            ← Voltar para seleção
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <select
                                                            value={route.estado || ''}
                                                            onChange={(e) => handleStateSelection(type, index, e.target.value)}
                                                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                                        >
                                                            <option value="">Selecione um estado...</option>
                                                            <option value="__CREATE_NEW__" className="font-semibold text-indigo-600">
                                                                ➕ Criar Novo Estado
                                                            </option>

                                                            {/* Existing States */}
                                                            {availableStates.length > 0 && (
                                                                <>
                                                                    <option disabled>── Estados Existentes ──</option>
                                                                    {availableStates.map(state => (
                                                                        <option key={state} value={state}>
                                                                            {state}
                                                                        </option>
                                                                    ))}
                                                                </>
                                                            )}

                                                            {/* Custom States */}
                                                            {customStates.filter(s => !availableStates.includes(s)).length > 0 && (
                                                                <>
                                                                    <option disabled>── Estados Novos ──</option>
                                                                    {customStates.filter(s => !availableStates.includes(s)).map(state => (
                                                                        <option key={`custom-${state}`} value={state}>
                                                                            🆕 {state}
                                                                        </option>
                                                                    ))}
                                                                </>
                                                            )}
                                                        </select>

                                                        {/* Show delete button only for custom states */}
                                                        {route.estado && isCustomState(route.estado) && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteCustomState(route.estado)}
                                                                className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                                title="Deletar estado customizado"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Descrição *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={route.descricao}
                                                    onChange={(e) => updateRoute(type, index, 'descricao', e.target.value)}
                                                    placeholder="Ex: Cliente forneceu todos os dados necessários"
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeRoute(type, index)}
                                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors h-fit"
                                            title="Remover rota"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                    <strong>Rotas</strong> definem para onde a conversa pode ir a partir deste estado.
                    Configure pelo menos uma rota de sucesso.
                </p>
            </div>

            {/* Show custom states summary if any exist */}
            {customStates.length > 0 && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                    <p className="text-sm text-purple-900 dark:text-purple-200 mb-2">
                        <strong>🆕 Estados Novos Criados ({customStates.length}):</strong>
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {customStates.map(state => (
                            <span
                                key={state}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-md text-xs font-medium"
                            >
                                {state}
                                <button
                                    type="button"
                                    onClick={() => handleDeleteCustomState(state)}
                                    className="p-0.5 hover:bg-purple-200 dark:hover:bg-purple-800 rounded transition-colors"
                                    title="Remover estado"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                        Estes estados serão salvos quando você criar este estado. Use-os nas rotas abaixo.
                    </p>
                </div>
            )}

            {renderRouteSection(
                'rota_de_sucesso',
                '✅ Rotas de Sucesso',
                'green',
                'Quando a missão do estado é cumprida com sucesso'
            )}

            {renderRouteSection(
                'rota_de_persistencia',
                '🔄 Rotas de Persistência',
                'yellow',
                'Quando precisa insistir ou coletar mais informações'
            )}

            {renderRouteSection(
                'rota_de_escape',
                '🚪 Rotas de Escape',
                'red',
                'Quando precisa sair, escalar ou transferir para humano'
            )}
        </div>
    );
}

