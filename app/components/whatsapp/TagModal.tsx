"use client";

import { useState } from "react";
import Modal from "../Modal";

interface TagModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateTag: (name: string, color: string) => Promise<void>;
}

const TAG_COLORS = [
    '#6366f1', '#ef4444', '#f59e0b', '#10b981',
    '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'
];

export default function TagModal({
    isOpen,
    onClose,
    onCreateTag,
}: TagModalProps) {
    const [newTagName, setNewTagName] = useState("");
    const [newTagColor, setNewTagColor] = useState("#6366f1");

    const handleSubmit = async () => {
        await onCreateTag(newTagName, newTagColor);
        setNewTagName("");
        setNewTagColor("#6366f1");
    };

    const handleClose = () => {
        setNewTagName("");
        setNewTagColor("#6366f1");
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Nova Tag">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nome da Tag
                    </label>
                    <input
                        type="text"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="Ex: Cliente VIP, Aguardando Pagamento"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cor
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {TAG_COLORS.map(color => (
                            <button
                                key={color}
                                onClick={() => setNewTagColor(color)}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${newTagColor === color
                                    ? 'border-gray-900 dark:border-white scale-110'
                                    : 'border-transparent hover:scale-105'
                                    }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handleClose}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!newTagName.trim()}
                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Criar Tag
                    </button>
                </div>
            </div>
        </Modal>
    );
}
