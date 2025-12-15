import Modal from "../../../components/Modal";
import { Save } from "lucide-react";
import { ReminderModalProps } from '../interfaces';

export default function ReminderModal({
    isOpen,
    onClose,
    onSave,
    isEditing,
    form,
    onFormChange,
}: ReminderModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Editar Lembrete" : "Criar Lembrete"}
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
                        placeholder="Ex: Lembrete de Reunião"
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
                        placeholder="Mensagem do lembrete..."
                        rows={4}
                        className="input-primary resize-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Agendado Para
                    </label>
                    <input
                        type="datetime-local"
                        value={form.scheduledFor}
                        onChange={(e) =>
                            onFormChange({ ...form, scheduledFor: e.target.value })
                        }
                        className="input-primary"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Destinatários (separados por vírgula)
                    </label>
                    <input
                        type="text"
                        value={form.recipients}
                        onChange={(e) =>
                            onFormChange({ ...form, recipients: e.target.value })
                        }
                        placeholder="email1@example.com, email2@example.com"
                        className="input-primary"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="reminder-active"
                        checked={form.isActive}
                        onChange={(e) =>
                            onFormChange({ ...form, isActive: e.target.checked })
                        }
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="reminder-active" className="text-sm text-gray-700">
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
