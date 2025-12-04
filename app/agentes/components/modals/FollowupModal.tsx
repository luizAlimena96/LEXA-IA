import Modal from "@/app/components/Modal";
import { Save } from "lucide-react";

interface FollowupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    isEditing: boolean;
    form: {
        name: string;
        condition: string;
        message: string;
        delayHours: number;
        isActive: boolean;
    };
    onFormChange: (form: any) => void;
}

export default function FollowupModal({
    isOpen,
    onClose,
    onSave,
    isEditing,
    form,
    onFormChange,
}: FollowupModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Editar Followup" : "Criar Followup"}
            size="lg"
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome *
                    </label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) =>
                            onFormChange({ ...form, name: e.target.value })
                        }
                        placeholder="Ex: Lembrete após 24h"
                        className="input-primary"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Condição
                    </label>
                    <input
                        type="text"
                        value={form.condition}
                        onChange={(e) =>
                            onFormChange({ ...form, condition: e.target.value })
                        }
                        placeholder="Ex: status = AGUARDANDO"
                        className="input-primary"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mensagem *
                    </label>
                    <textarea
                        value={form.message}
                        onChange={(e) =>
                            onFormChange({ ...form, message: e.target.value })
                        }
                        placeholder="Mensagem a ser enviada..."
                        rows={4}
                        className="input-primary resize-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delay (horas)
                    </label>
                    <input
                        type="number"
                        value={form.delayHours}
                        onChange={(e) =>
                            onFormChange({ ...form, delayHours: parseInt(e.target.value) })
                        }
                        min="1"
                        className="input-primary"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="followup-active"
                        checked={form.isActive}
                        onChange={(e) =>
                            onFormChange({ ...form, isActive: e.target.checked })
                        }
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="followup-active" className="text-sm text-gray-700">
                        Ativo
                    </label>
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
