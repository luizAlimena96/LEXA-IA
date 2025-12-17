"use client";

import { useState, useMemo } from "react";
import { X, Search, FileText, Mic, Image } from "lucide-react";
import type { QuickResponse } from "@/app/types";

interface QuickResponsePickerProps {
    isOpen: boolean;
    onClose: () => void;
    quickResponses: QuickResponse[];
    onSelectResponse: (response: QuickResponse) => void;
}

export default function QuickResponsePicker({
    isOpen,
    onClose,
    quickResponses,
    onSelectResponse,
}: QuickResponsePickerProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredResponses = useMemo(() => {
        return quickResponses.filter(r =>
            r.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [quickResponses, searchQuery]);

    const getTypeIcon = (type: 'TEXT' | 'AUDIO' | 'IMAGE') => {
        switch (type) {
            case 'TEXT': return <FileText className="w-3.5 h-3.5" />;
            case 'AUDIO': return <Mic className="w-3.5 h-3.5" />;
            case 'IMAGE': return <Image className="w-3.5 h-3.5" />;
        }
    };

    const getTypeBgColor = (type: 'TEXT' | 'AUDIO' | 'IMAGE') => {
        switch (type) {
            case 'TEXT': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
            case 'AUDIO': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
            case 'IMAGE': return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-30" onClick={onClose}></div>

            {/* Picker Panel */}
            <div className="absolute bottom-16 left-0 right-0 mx-2 sm:left-auto sm:right-2 sm:mx-0 sm:w-80 bg-white dark:bg-[#12121d] border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-40 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                        Respostas Rápidas
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 dark:bg-[#1a1a28] border-none rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Responses List */}
                <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                    {filteredResponses.length === 0 ? (
                        <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
                            {searchQuery ? 'Nenhuma resposta encontrada' : 'Nenhuma resposta rápida'}
                        </div>
                    ) : (
                        filteredResponses.map(response => (
                            <button
                                key={response.id}
                                onClick={() => {
                                    onSelectResponse(response);
                                    onClose();
                                }}
                                className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-50 dark:hover:bg-[#1a1a28] rounded-lg transition-colors text-left group"
                            >
                                {/* Type Icon */}
                                <div className={`p-1.5 rounded-lg ${getTypeBgColor(response.type)}`}>
                                    {getTypeIcon(response.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                        {response.name}
                                    </h4>
                                    {response.type === 'TEXT' && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {response.content.slice(0, 40)}...
                                        </p>
                                    )}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
