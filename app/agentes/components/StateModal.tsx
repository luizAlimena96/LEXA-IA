import Modal from "../../components/Modal";
import { Save, Plus, Trash2 } from "lucide-react";
import RouteEditor from "./RouteEditor";
import { AgentState, MatrixItem } from "../../services/agentService";

interface DataCollection {
    key: string;
    type: string;
    description: string;
}

interface StateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    editing: AgentState | null;
    form: {
        name: string;
        missionPrompt: string;
        availableRoutes: any;
        dataCollections: DataCollection[];
        order: number;
        matrixItemId?: string | null;
    };
    onFormChange: (form: any) => void;
    availableStates: string[];
    matrixItems: MatrixItem[];
}

export default function StateModal({
    isOpen,
    onClose,
    onSave,
    editing,
    form,
    onFormChange,
    availableStates,
    matrixItems
}: StateModalProps) {
    const handleAddDataCollection = () => {
        onFormChange({
            ...form,
            dataCollections: [
                ...form.dataCollections,
                { key: '', type: '', description: '' }
            ]
        });
    };

    const handleRemoveDataCollection = (index: number) => {
        const newCollections = form.dataCollections.filter((_, i) => i !== index);
        onFormChange({ ...form, dataCollections: newCollections });
    };

    const handleUpdateDataCollection = (index: number, field: keyof DataCollection, value: string) => {
        const newCollections = [...form.dataCollections];
        newCollections[index] = { ...newCollections[index], [field]: value };
        onFormChange({ ...form, dataCollections: newCollections });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editing ? "Editar Estado" : "Criar Estado"}
            size="xl"
        >
            <div className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 border-b pb-2">Informações Básicas</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nome do Estado *
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => onFormChange({ ...form, name: e.target.value })}
                                placeholder="Ex: INICIO, COLETANDO_DADOS"
                                className="input-primary"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Use MAIÚSCULAS e underscores (ex: COLETA_EMAIL)
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ordem de Exibição
                            </label>
                            <input
                                type="number"
                                value={form.order}
                                onChange={(e) => onFormChange({ ...form, order: parseInt(e.target.value) || 0 })}
                                placeholder="0"
                                className="input-primary"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Ordem de exibição na lista (menor = primeiro)
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Missão do Estado *
                        </label>
                        <textarea
                            value={form.missionPrompt}
                            onChange={(e) => onFormChange({ ...form, missionPrompt: e.target.value })}
                            placeholder="Ex: Coletar nome completo e email do cliente de forma educada e natural"
                            rows={3}
                            className="input-primary resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Descreva o objetivo/missão deste estado na conversa
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Vincular à Matriz (Opcional)
                        </label>
                        <select
                            value={form.matrixItemId || ""}
                            onChange={(e) => {
                                const selectedId = e.target.value;
                                const selectedItem = matrixItems.find(item => item.id === selectedId);

                                const updates: any = { matrixItemId: selectedId || null };

                                // Auto-fill fields if empty and item selected
                                if (selectedItem) {
                                    if (!form.name) updates.name = selectedItem.title.toUpperCase().replace(/\s+/g, '_');
                                    if (!form.missionPrompt) updates.missionPrompt = selectedItem.description;
                                }

                                onFormChange({ ...form, ...updates });
                            }}
                            className="input-primary"
                        >
                            <option value="">Nenhum item vinculado</option>
                            {matrixItems.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.title} ({item.category})
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Vincular a um item da matriz preenche automaticamente alguns campos e estabelece a relação
                        </p>
                    </div>
                </div>

                {/* Data Collection */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="font-semibold text-gray-900">Coleta de Dados (Opcional)</h3>
                        <button
                            type="button"
                            onClick={handleAddDataCollection}
                            className="flex items-center gap-1 px-3 py-1 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Adicionar
                        </button>
                    </div>

                    {form.dataCollections.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                            Nenhuma coleta de dados configurada. Clique em "Adicionar" para criar uma.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {form.dataCollections.map((collection, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <div className="flex items-start justify-between mb-3">
                                        <span className="text-sm font-medium text-gray-700">
                                            Coleta #{index + 1}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveDataCollection(index)}
                                            className="text-red-600 hover:text-red-700 transition-colors"
                                            title="Remover"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Chave de Dados
                                            </label>
                                            <input
                                                type="text"
                                                value={collection.key}
                                                onChange={(e) => handleUpdateDataCollection(index, 'key', e.target.value)}
                                                placeholder="Ex: nome_cliente"
                                                className="input-primary text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Tipo de Dados
                                            </label>
                                            <select
                                                value={collection.type}
                                                onChange={(e) => handleUpdateDataCollection(index, 'type', e.target.value)}
                                                className="input-primary text-sm"
                                            >
                                                <option value="">Selecione...</option>
                                                <option value="string">Texto (string)</option>
                                                <option value="email">Email</option>
                                                <option value="phone">Telefone</option>
                                                <option value="number">Número</option>
                                                <option value="date">Data</option>
                                                <option value="boolean">Sim/Não</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Descrição
                                            </label>
                                            <input
                                                type="text"
                                                value={collection.description}
                                                onChange={(e) => handleUpdateDataCollection(index, 'description', e.target.value)}
                                                placeholder="Ex: Nome completo do cliente"
                                                className="input-primary text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Routes */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 border-b pb-2">Rotas de Transição *</h3>
                    <RouteEditor
                        routes={form.availableRoutes}
                        onChange={(routes) => onFormChange({ ...form, availableRoutes: routes })}
                        availableStates={availableStates}
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSave}
                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {editing ? "Atualizar" : "Criar"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
