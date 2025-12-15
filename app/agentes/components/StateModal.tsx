import Modal from "../../components/Modal";
import { Save, Plus, Trash2, Settings, MessageSquare, Image, Wrench, ChevronDown, ChevronUp, X } from "lucide-react";
import RouteEditor from "./RouteEditor";
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
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center justify-between w-full font-semibold text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
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
                        <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Formato da resposta da IA neste estado
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Status do lead ao entrar neste estado
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Imagem/vídeo a enviar neste estado
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Momento do envio da mídia
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Ferramentas que a IA pode usar neste estado (separadas por vírgula)
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Proibições Específicas
                                </label>
                                <textarea
                                    value={form.prohibitions || ""}
                                    onChange={(e) => onFormChange({ ...form, prohibitions: e.target.value || null })}
                                    placeholder="Ex: Não mencionar preços, Não agendar para fins de semana..."
                                    rows={2}
                                    className="input-primary resize-none"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    O que a IA NÃO deve fazer neste estado específico
                                </p>
                            </div>
                        </div>
                    )}
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
