"use client";

import { MessageSquare, Zap, Brain } from "lucide-react";

interface ChatMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenFeedback: () => void;
    onOpenQuickResponses: () => void;
    onOpenAIDebug?: () => void;
}

export default function ChatMenu({
    isOpen,
    onClose,
    onOpenFeedback,
    onOpenQuickResponses,
    onOpenAIDebug,
}: ChatMenuProps) {
    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-10" onClick={onClose}></div>
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#12121d] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                <button
                    onClick={() => {
                        onOpenQuickResponses();
                        onClose();
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                >
                    <Zap className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    Respostas Rápidas
                </button>
                {onOpenAIDebug && (
                    <button
                        onClick={() => {
                            onOpenAIDebug();
                            onClose();
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                    >
                        <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        Depuração de IA
                    </button>
                )}
                <button
                    onClick={() => {
                        onOpenFeedback();
                        onClose();
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                >
                    <MessageSquare className="w-4 h-4" />
                    Enviar Feedback desta Conversa
                </button>
            </div>
        </>
    );
}
