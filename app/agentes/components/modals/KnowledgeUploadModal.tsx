import Modal from "../../../components/Modal";
import { Upload } from "lucide-react";
import { KnowledgeUploadModalProps } from '../interfaces';

export default function KnowledgeUploadModal({
    isOpen,
    onClose,
    onUpload,
    uploadTitle,
    onTitleChange,
    uploadFile,
    onFileChange,
}: KnowledgeUploadModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Upload de Conhecimento">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título
                    </label>
                    <input
                        type="text"
                        value={uploadTitle}
                        onChange={(e) => onTitleChange(e.target.value)}
                        placeholder="Ex: Manual do Produto"
                        className="input-primary"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Arquivo
                    </label>
                    <input
                        type="file"
                        onChange={(e) => onFileChange(e.target.files?.[0] || null)}
                        accept=".pdf,.txt,.docx"
                        className="w-full"
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
                        onClick={onUpload}
                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <Upload className="w-4 h-4" />
                        Enviar
                    </button>
                </div>
            </div>
        </Modal>
    );
}
