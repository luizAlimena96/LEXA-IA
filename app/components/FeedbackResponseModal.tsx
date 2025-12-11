"use client";

import { useState } from "react";
import Modal from "./Modal";
import { Send } from "lucide-react";

interface FeedbackResponseModalProps {
    isOpen: boolean;
    onClose: () => void;
    feedbackId: string;
    customerName: string;
    feedbackComment: string;
    onSubmit: (feedbackId: string, response: string) => Promise<void>;
}

export default function FeedbackResponseModal({
    isOpen,
    onClose,
    feedbackId,
    customerName,
    feedbackComment,
    onSubmit,
}: FeedbackResponseModalProps) {
    const [response, setResponse] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!response.trim()) return;

        setSubmitting(true);
        try {
            await onSubmit(feedbackId, response);
            setResponse("");
            onClose();
        } catch (error) {
            console.error("Error submitting response:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setResponse("");
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={`Responder Feedback - ${customerName}`}>
            <div className="space-y-4">
                {/* Original Feedback */}
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Feedback Original:
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {feedbackComment}
                    </p>
                </div>

                {/* Response Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Sua Resposta
                    </label>
                    <textarea
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        placeholder="Digite sua resposta ao feedback..."
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handleClose}
                        disabled={submitting}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!response.trim() || submitting}
                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Enviar Resposta
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
