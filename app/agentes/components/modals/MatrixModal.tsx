import Modal from "@/app/components/Modal";
import { Save } from "lucide-react";

interface MatrixModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    isEditing: boolean;
    form: {
        title: string;
        category: string;
        description: string;
        response: string;
        priority: number;
        personality: string;
        prohibitions: string;
        scheduling: string;
        data: string;
        writing: string;
        dataExtraction: string;
        matrixFlow: string;
    };
    onFormChange: (form: any) => void;
}

export default function MatrixModal({
    isOpen,
    onClose,
    onSave,
    isEditing,
    form,
    onFormChange,
}: MatrixModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Editar Item da Matriz" : "Criar Item da Matriz"}
            size="xl"
        >
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Título *
                        </label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) =>
                                onFormChange({ ...form, title: e.target.value })
                            }
                            placeholder="Ex: Dúvida sobre Preço"
                            className="input-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Categoria *
                        </label>
                        <input
                            type="text"
                            value={form.category}
                            onChange={(e) =>
                                onFormChange({ ...form, category: e.target.value })
                            }
                            placeholder="Ex: Vendas"
                            className="input-primary"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descrição
                    </label>
                    <textarea
                        value={form.description}
                        onChange={(e) =>
                            onFormChange({ ...form, description: e.target.value })
                        }
                        placeholder="Descrição do cenário..."
                        rows={2}
                        className="input-primary resize-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Resposta *
                    </label>
                    <textarea
                        value={form.response}
                        onChange={(e) =>
                            onFormChange({ ...form, response: e.target.value })
                        }
                        placeholder="Como o agente deve responder..."
                        rows={4}
                        className="input-primary resize-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prioridade
                    </label>
                    <input
                        type="number"
                        value={form.priority}
                        onChange={(e) =>
                            onFormChange({ ...form, priority: parseInt(e.target.value) })
                        }
                        min="1"
                        max="10"
                        className="input-primary"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Personalidade
                    </label>
                    <textarea
                        value={form.personality}
                        onChange={(e) =>
                            onFormChange({ ...form, personality: e.target.value })
                        }
                        placeholder="Tom e personalidade específica..."
                        rows={2}
                        className="input-primary resize-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Proibições
                    </label>
                    <textarea
                        value={form.prohibitions}
                        onChange={(e) =>
                            onFormChange({ ...form, prohibitions: e.target.value })
                        }
                        placeholder="O que NÃO fazer..."
                        rows={2}
                        className="input-primary resize-none"
                    />
                </div>

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
                        {isEditing ? "Atualizar" : "Criar"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
