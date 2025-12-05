"use client";

import { Plus, Check } from "lucide-react";

interface TagData {
    id: string;
    name: string;
    color: string;
}

interface TagMenuProps {
    isOpen: boolean;
    onClose: () => void;
    availableTags: TagData[];
    selectedTags: TagData[];
    onAddTag: (tagId: string) => void;
    onRemoveTag: (tagId: string) => void;
    onCreateNew: () => void;
}

export default function TagMenu({
    isOpen,
    onClose,
    availableTags,
    selectedTags,
    onAddTag,
    onRemoveTag,
    onCreateNew,
}: TagMenuProps) {
    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-10" onClick={onClose}></div>
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20 p-2">
                <div className="mb-2 px-2 py-1 border-b border-gray-100 flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Tags</span>
                    <button
                        onClick={() => {
                            onClose();
                            onCreateNew();
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                    >
                        <Plus className="w-3 h-3" /> Nova
                    </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1">
                    {availableTags.length === 0 ? (
                        <p className="text-xs text-gray-500 px-2 py-2 text-center">Nenhuma tag criada</p>
                    ) : (
                        availableTags.map(tag => {
                            const isSelected = selectedTags.some(t => t.id === tag.id);
                            return (
                                <button
                                    key={tag.id}
                                    onClick={() => isSelected ? onRemoveTag(tag.id) : onAddTag(tag.id)}
                                    className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded text-sm group"
                                >
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: tag.color }}
                                        ></span>
                                        <span className="text-gray-700 truncate max-w-[140px]">{tag.name}</span>
                                    </div>
                                    {isSelected && <Check className="w-3 h-3 text-indigo-600" />}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </>
    );
}
