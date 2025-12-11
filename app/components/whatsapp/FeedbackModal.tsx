"use client";

import { useState } from "react";
import Modal from "../Modal";
import { Send, Star } from "lucide-react";

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    chatName: string;
    chatPhone: string;
    onSubmit: (feedbackText: string, rating: number) => Promise<void>;
}

export default function FeedbackModal({
    isOpen,
    onClose,
    chatName,
    chatPhone,
    onSubmit,
}: FeedbackModalProps) {
    const [feedbackText, setFeedbackText] = useState("");
    const [rating, setRating] = useState(3); // Default to 3 stars (MEDIUM)
    const [hoveredRating, setHoveredRating] = useState(0);

    const handleSubmit = async () => {
        await onSubmit(feedbackText, rating);
        setFeedbackText("");
        setRating(3);
    };

    const handleClose = () => {
        setFeedbackText("");
        setRating(3);
        onClose();
    };

    const getSeverityLabel = (stars: number) => {
        switch (stars) {
            case 5: return "🔴 Crítico";
            case 4: return "🟠 Alto";
            case 3: return "🟡 Médio";
            case 2:
            case 1: return "🟢 Baixo";
            default: return "🟡 Médio";
        }
    };

    const getStarColor = (stars: number) => {
        switch (stars) {
            case 5: return "fill-red-300 text-red-300"; // Pastel red
            case 4: return "fill-orange-300 text-orange-300"; // Pastel orange
            case 3: return "fill-yellow-300 text-yellow-300"; // Pastel yellow
            case 2:
            case 1: return "fill-green-300 text-green-300"; // Pastel green
            default: return "fill-yellow-300 text-yellow-300";
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={`Feedback - ${chatName}`}>
            <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Cliente:</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{chatName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Telefone: {chatPhone}</p>
                </div>

                {/* Rating Selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nível de Severidade
                    </label>
                    <div className="flex items-center gap-4">
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    className="transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={`w-8 h-8 ${star <= (hoveredRating || rating)
                                            ? getStarColor(hoveredRating || rating)
                                            : "text-gray-300 dark:text-gray-600"
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {getSeverityLabel(hoveredRating || rating)}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        ⭐ = Baixo | ⭐⭐⭐ = Médio | ⭐⭐⭐⭐ = Alto | ⭐⭐⭐⭐⭐ = Crítico
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Descreva o feedback sobre esta conversa
                    </label>
                    <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Descreva o problema ou feedback sobre esta conversa..."
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
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
                        disabled={!feedbackText.trim()}
                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-4 h-4" />
                        Enviar Feedback
                    </button>
                </div>
            </div>
        </Modal>
    );
}
