import { Plus, X } from "lucide-react";
import { useState } from "react";

interface Route {
    estado: string;
    descricao: string;
}

interface RouteEditorProps {
    routes: {
        rota_de_sucesso: Route[];
        rota_de_persistencia: Route[];
        rota_de_escape: Route[];
    };
    onChange: (routes: any) => void;
    availableStates: string[];
}

export default function RouteEditor({ routes, onChange, availableStates }: RouteEditorProps) {
    const [creatingNewState, setCreatingNewState] = useState<{ [key: string]: boolean }>({});

    const addRoute = (type: 'rota_de_sucesso' | 'rota_de_persistencia' | 'rota_de_escape') => {
        onChange({
            ...routes,
            [type]: [...routes[type], { estado: '', descricao: '' }]
        });
    };

    const removeRoute = (type: 'rota_de_sucesso' | 'rota_de_persistencia' | 'rota_de_escape', index: number) => {
        const key = `${type}-${index}`;
        const newCreatingState = { ...creatingNewState };
        delete newCreatingState[key];
        setCreatingNewState(newCreatingState);

        onChange({
            ...routes,
            [type]: routes[type].filter((_, i) => i !== index)
        });
    };

    const updateRoute = (
        type: 'rota_de_sucesso' | 'rota_de_persistencia' | 'rota_de_escape',
        index: number,
        field: 'estado' | 'descricao',
        value: string
    ) => {
        const newRoutes = [...routes[type]];
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

    const renderRouteSection = (
        type: 'rota_de_sucesso' | 'rota_de_persistencia' | 'rota_de_escape',
        title: string,
        color: 'green' | 'yellow' | 'red',
        description: string
    ) => {
        const colorClasses = {
            green: {
                bg: 'bg-green-50',
                border: 'border-green-200',
                text: 'text-green-700',
                button: 'bg-green-600 hover:bg-green-700'
            },
            yellow: {
                bg: 'bg-yellow-50',
                border: 'border-yellow-200',
                text: 'text-yellow-700',
                button: 'bg-yellow-600 hover:bg-yellow-700'
            },
            red: {
                bg: 'bg-red-50',
                border: 'border-red-200',
                text: 'text-red-700',
                button: 'bg-red-600 hover:bg-red-700'
            }
        }[color];


        return (
            <div className={`border ${colorClasses.border} ${colorClasses.bg} rounded-lg p-4`}>
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h4 className={`font-semibold ${colorClasses.text}`}>{title}</h4>
                        <p className="text-sm text-gray-600 mt-0.5">{description}</p>
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
                    {routes[type].length === 0 ? (
                        <p className="text-sm text-gray-500 italic">Nenhuma rota configurada</p>
                    ) : (
                        routes[type].map((route, index) => {
                            const key = `${type}-${index}`;
                            const isCreatingNew = creatingNewState[key];

                            return (
                                <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                                    <div className="flex gap-3">
                                        <div className="flex-1 space-y-2">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
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
                                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                                                autoFocus
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (route.estado.trim()) {
                                                                        setCreatingNewState({ ...creatingNewState, [key]: false });
                                                                    }
                                                                }}
                                                                className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                                                                title="Confirmar"
                                                            >
                                                                OK
                                                            </button>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setCreatingNewState({ ...creatingNewState, [key]: false });
                                                                updateRoute(type, index, 'estado', '');
                                                            }}
                                                            className="text-xs text-indigo-600 hover:text-indigo-700"
                                                        >
                                                            ← Voltar para seleção
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <select
                                                        value={route.estado || ''}
                                                        onChange={(e) => handleStateSelection(type, index, e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                                    >
                                                        <option value="">Selecione um estado...</option>
                                                        <option value="__CREATE_NEW__" className="font-semibold text-indigo-600">
                                                            ➕ Criar Novo Estado
                                                        </option>
                                                        <option disabled>────────────────</option>
                                                        {availableStates.map(state => (
                                                            <option key={state} value={state}>
                                                                {state}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Descrição *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={route.descricao}
                                                    onChange={(e) => updateRoute(type, index, 'descricao', e.target.value)}
                                                    placeholder="Ex: Cliente forneceu todos os dados necessários"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeRoute(type, index)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors h-fit"
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                    <strong>Rotas</strong> definem para onde a conversa pode ir a partir deste estado.
                    Configure pelo menos uma rota de sucesso.
                </p>
            </div>

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
