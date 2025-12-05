import Modal from "../../components/Modal";
import { Save, Plus, Trash2, Settings, MessageSquare, Image, Wrench, ChevronDown, ChevronUp } from "lucide-react";
import RouteEditor from "./RouteEditor";
import { AgentState, MatrixItem } from "../../services/agentService";
import { useState } from "react";

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
        // Novos campos
        mediaId?: string | null;
        mediaTiming?: string | null;
        responseType?: string | null;
        prohibitions?: string | null;
        tools?: string | null;
        crmStatus?: string | null;
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
    const [showAdvanced, setShowAdvanced] = useState(false);
    // Track custom states created by user during this editing session
    const [customStates, setCustomStates] = useState<string[]>([]);

    const handleAddDataCollection = () => {
        onFormChange({
            ...form,
            dataCollections: [
                ...(form.dataCollections || []),
                { key: '', type: '', description: '' }
            ]
        });
    };

    const handleRemoveDataCollection = (index: number) => {
        const newCollections = (form.dataCollections || []).filter((_, i) => i !== index);
        onFormChange({ ...form, dataCollections: newCollections });
    };

    const handleUpdateDataCollection = (index: number, field: keyof DataCollection, value: string) => {
        const newCollections = [...(form.dataCollections || [])];
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

                    {(!form.dataCollections || form.dataCollections.length === 0) ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                            Nenhuma coleta de dados configurada. Clique em "Adicionar" para criar uma.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {(form.dataCollections || []).map((collection, index) => (
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

                {/* Advanced Settings - Collapsible */}
                <div className="space-y-4">
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center justify-between w-full font-semibold text-gray-900 border-b pb-2 hover:text-indigo-600 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Configurações Avançadas
                        </div>
                        {showAdvanced ? (
                            <ChevronUp className="w-5 h-5" />
                        ) : (
                            <ChevronDown className="w-5 h-5" />
                        )}
                    </button>

                    {showAdvanced && (
                        <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            {/* Message Response Type */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <MessageSquare className="w-4 h-4 inline mr-1" />
                                        Tipo de Resposta
                                    </label>
                                    <select
                                        value={form.responseType || ""}
                                        onChange={(e) => onFormChange({ ...form, responseType: e.target.value || null })}
                                        className="input-primary"
                                    >
                                        <option value="">Padrão (Texto)</option>
                                        <option value="text">Texto</option>
                                        <option value="audio">Áudio</option>
                                        <option value="quick_reply">Resposta Rápida</option>
                                        <option value="list">Lista/Menu</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Formato da resposta da IA neste estado
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status CRM
                                    </label>
                                    <select
                                        value={form.crmStatus || ""}
                                        onChange={(e) => onFormChange({ ...form, crmStatus: e.target.value || null })}
                                        className="input-primary"
                                    >
                                        <option value="">Nenhum</option>
                                        <option value="NEW">Novo Lead</option>
                                        <option value="CONTACTED">Contatado</option>
                                        <option value="QUALIFIED">Qualificado</option>
                                        <option value="PROPOSAL_SENT">Proposta Enviada</option>
                                        <option value="WON">Ganho</option>
                                        <option value="LOST">Perdido</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Status do lead ao entrar neste estado
                                    </p>
                                </div>
                            </div>

                            {/* Media Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Image className="w-4 h-4 inline mr-1" />
                                        ID da Mídia
                                    </label>
                                    <input
                                        type="text"
                                        value={form.mediaId || ""}
                                        onChange={(e) => onFormChange({ ...form, mediaId: e.target.value || null })}
                                        placeholder="Ex: URL do Google Drive ou ID"
                                        className="input-primary"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Imagem/vídeo a enviar neste estado
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Quando Enviar Mídia
                                    </label>
                                    <select
                                        value={form.mediaTiming || ""}
                                        onChange={(e) => onFormChange({ ...form, mediaTiming: e.target.value || null })}
                                        className="input-primary"
                                    >
                                        <option value="">Não enviar</option>
                                        <option value="before">Antes da resposta</option>
                                        <option value="after">Depois da resposta</option>
                                        <option value="only">Apenas mídia (sem texto)</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Momento do envio da mídia
                                    </p>
                                </div>
                            </div>

                            {/* Tools */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Wrench className="w-4 h-4 inline mr-1" />
                                    Ferramentas Disponíveis
                                </label>
                                <input
                                    type="text"
                                    value={form.tools || ""}
                                    onChange={(e) => onFormChange({ ...form, tools: e.target.value || null })}
                                    placeholder="Ex: agenda,consulta_precos,verificar_estoque"
                                    className="input-primary"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Ferramentas que a IA pode usar neste estado (separadas por vírgula)
                                </p>
                            </div>

                            {/* Prohibitions */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Proibições Específicas
                                </label>
                                <textarea
                                    value={form.prohibitions || ""}
                                    onChange={(e) => onFormChange({ ...form, prohibitions: e.target.value || null })}
                                    placeholder="Ex: Não mencionar preços, Não agendar para fins de semana..."
                                    rows={2}
                                    className="input-primary resize-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    O que a IA NÃO deve fazer neste estado específico
                                </p>
                            </div>
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
                        customStates={customStates}
                        onCustomStatesChange={setCustomStates}
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
