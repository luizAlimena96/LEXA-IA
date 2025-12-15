import Modal from "../../../components/Modal";
import { Save } from "lucide-react";
import { KnowledgeEditModalProps } from '../interfaces';

export default function KnowledgeEditModal({
    isOpen,
    onClose,
    onSave,
    isEditing,
    form,
    onFormChange,
}: KnowledgeEditModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Editar Conhecimento" : "Criar Conhecimento"}
            size="lg"
        >
            <div className="space-y-4">
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
                        placeholder="Ex: Manual do Produto"
                        className="input-primary"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo
                    </label>
                    <select
                        value={form.type}
                        onChange={(e) =>
                            onFormChange({
                                ...form,
                                type: e.target.value as "DOCUMENT" | "FAQ" | "TEXT",
                            })
                        }
                        className="input-primary"
                    >
                        <option value="TEXT">Texto</option>
                        <option value="DOCUMENT">Documento</option>
                        <option value="FAQ">FAQ</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Conteúdo *
                    </label>
                    <textarea
                        value={form.content}
                        onChange={(e) =>
                            onFormChange({ ...form, content: e.target.value })
                        }
                        placeholder="Digite o conteúdo do conhecimento..."
                        rows={8}
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
