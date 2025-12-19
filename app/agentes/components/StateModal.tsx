import Modal from "../../components/Modal";
import { Save, Plus, Trash2, X } from "lucide-react";
import RouteEditor from "./RouteEditor";
import MediaManager from "./MediaManager";
import { useState } from "react";
import { AgentState, StateModalProps } from './interfaces';

export default function StateModal({
    isOpen,
    onClose,
    onSave,
    editing,
    form,
    onFormChange,
    availableStates
}: StateModalProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [customStates, setCustomStates] = useState<string[]>([]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editing ? "Editar Estado" : "Criar Estado"}
            size="xl"
        >
            <div className="space-y-6">
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2">Informações Básicas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Nome do Estado *
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => onFormChange({ ...form, name: e.target.value })}
                                placeholder="Ex: INICIO, COLETANDO_DADOS"
                                className="input-primary"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Use MAIÚSCULAS e underscores (ex: COLETA_EMAIL)
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Ordem de Exibição
                            </label>
                            <input
                                type="number"
                                value={form.order}
                                onChange={(e) => onFormChange({ ...form, order: parseInt(e.target.value) || 0 })}
                                placeholder="0"
                                className="input-primary"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Ordem de exibição na lista (menor = primeiro)
                            </p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Missão do Estado *
                        </label>
                        <textarea
                            value={form.missionPrompt}
                            onChange={(e) => onFormChange({ ...form, missionPrompt: e.target.value })}
                            placeholder="Ex: Coletar nome completo e email do cliente de forma educada e natural"
                            rows={3}
                            className="input-primary resize-none"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Descreva o objetivo/missão deste estado na conversa
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2">Coleta de Dados (Opcional)</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Chave de Dados
                            </label>
                            <input
                                type="text"
                                value={form.dataKey || ""}
                                onChange={(e) => onFormChange({ ...form, dataKey: e.target.value || null })}
                                placeholder="Ex: nome_cliente, valor_divida"
                                className="input-primary"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Nome da variável que será extraída (snake_case)
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Tipo de Dados
                            </label>
                            <select
                                value={form.dataType || ""}
                                onChange={(e) => onFormChange({ ...form, dataType: e.target.value || null })}
                                className="input-primary"
                            >
                                <option value="">Nenhum</option>
                                <option value="string">Texto (string)</option>
                                <option value="email">Email</option>
                                <option value="phone">Telefone</option>
                                <option value="number">Número</option>
                                <option value="date">Data</option>
                                <option value="boolean">Sim/Não (boolean)</option>
                            </select>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Tipo esperado do dado a ser extraído
                            </p>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Descrição e Instruções de Extração
                            </label>
                            <textarea
                                value={form.dataDescription || ""}
                                onChange={(e) => onFormChange({ ...form, dataDescription: e.target.value || null })}
                                placeholder="Descreva como extrair este dado, incluindo formato, validações e exemplos...&#10;&#10;Exemplo:&#10;- Extrair apenas o primeiro nome&#10;- Converter valores por extenso para números&#10;- Normalizar formato de telefone"
                                rows={4}
                                className="input-primary resize-none"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Instruções detalhadas para a IA sobre como extrair e validar este dado
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2">Rotas de Transição *</h3>
                    <RouteEditor
                        routes={form.availableRoutes}
                        onChange={(routes) => onFormChange({ ...form, availableRoutes: routes })}
                        availableStates={availableStates}
                        customStates={customStates}
                        onCustomStatesChange={setCustomStates}
                    />
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2">Mídias do Estado (Opcional)</h3>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Quando Enviar Mídias
                        </label>
                        <select
                            value={form.mediaTiming || "after"}
                            onChange={(e) => onFormChange({ ...form, mediaTiming: e.target.value || null })}
                            className="input-primary"
                        >
                            <option value="before">Antes da resposta de texto</option>
                            <option value="after">Depois da resposta de texto (padrão)</option>
                            <option value="only">Apenas mídias (sem texto)</option>
                        </select>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Define quando as mídias serão enviadas em relação à resposta da IA
                        </p>
                    </div>

                    <MediaManager
                        mediaItems={form.mediaItems || []}
                        onChange={(items) => onFormChange({ ...form, mediaItems: items })}
                    />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
