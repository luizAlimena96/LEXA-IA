"use client";

import { MessageSquare } from "lucide-react";

interface ChatMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenFeedback: () => void;
}

export default function ChatMenu({
    isOpen,
    onClose,
    onOpenFeedback,
}: ChatMenuProps) {
    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-10" onClick={onClose}></div>
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                <button
                    onClick={() => {
                        onOpenFeedback();
                        onClose();
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                >
                    <MessageSquare className="w-4 h-4" />
                    Enviar Feedback desta Conversa
                </button>
            </div>
        </>
    );
}
