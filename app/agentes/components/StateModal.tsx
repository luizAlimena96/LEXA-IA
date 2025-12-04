import Modal from "../../components/Modal";
import { Save } from "lucide-react";
import RouteEditor from "./RouteEditor";
import { AgentState } from "../../services/agentService";

interface StateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    editing: AgentState | null;
    form: {
        name: string;
        missionPrompt: string;
        availableRoutes: any;
        dataKey: string;
        dataDescription: string;
        dataType: string;
        tools: string;
        prohibitions: string;
        order: number;
    };
    onFormChange: (form: any) => void;
    availableStates: string[];
}

export default function StateModal({
    isOpen,
    onClose,
    onSave,
    editing,
    form,
    onFormChange,
    availableStates
}: StateModalProps) {
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
                </div>

                {/* Data Collection */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 border-b pb-2">Coleta de Dados (Opcional)</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Chave de Dados
                            </label>
                            <input
                                type="text"
                                value={form.dataKey}
                                onChange={(e) => onFormChange({ ...form, dataKey: e.target.value })}
                                placeholder="Ex: nome_cliente"
                                className="input-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo de Dados
                            </label>
                            <select
                                value={form.dataType}
                                onChange={(e) => onFormChange({ ...form, dataType: e.target.value })}
                                className="input-primary"
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Descrição
                            </label>
                            <input
                                type="text"
                                value={form.dataDescription}
                                onChange={(e) => onFormChange({ ...form, dataDescription: e.target.value })}
                                placeholder="Ex: Nome completo do cliente"
                                className="input-primary"
                            />
                        </div>
                    </div>
                </div>

                {/* Advanced Options */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 border-b pb-2">Configurações Avançadas</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ferramentas Disponíveis
                            </label>
                            <input
                                type="text"
                                value={form.tools}
                                onChange={(e) => onFormChange({ ...form, tools: e.target.value })}
                                placeholder="Ex: calendar, crm"
                                className="input-primary"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Ferramentas que a IA pode usar neste estado
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Proibições
                            </label>
                            <input
                                type="text"
                                value={form.prohibitions}
                                onChange={(e) => onFormChange({ ...form, prohibitions: e.target.value })}
                                placeholder="Ex: Não mencionar preços"
                                className="input-primary"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                O que a IA NÃO deve fazer neste estado
                            </p>
                        </div>
                    </div>
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
