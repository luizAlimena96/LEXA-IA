"use client";

import { useState } from "react";
import Modal from "../Modal";
import { Send } from "lucide-react";

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    chatName: string;
    chatPhone: string;
    onSubmit: (feedbackText: string) => Promise<void>;
}

export default function FeedbackModal({
    isOpen,
    onClose,
    chatName,
    chatPhone,
    onSubmit,
}: FeedbackModalProps) {
    const [feedbackText, setFeedbackText] = useState("");

    const handleSubmit = async () => {
        await onSubmit(feedbackText);
        setFeedbackText("");
    };

    const handleClose = () => {
        setFeedbackText("");
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={`Feedback - ${chatName}`}>
            <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Cliente:</p>
                    <p className="font-semibold text-gray-900">{chatName}</p>
                    <p className="text-sm text-gray-500 mt-1">Telefone: {chatPhone}</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descreva o feedback sobre esta conversa
                    </label>
                    <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Descreva o problema ou feedback sobre esta conversa..."
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-900"
                    />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                        onClick={handleClose}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                        Enviar Feedback
                    </button>
                </div>
            </div>
        </Modal>
    );
}
