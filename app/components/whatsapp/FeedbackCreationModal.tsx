"use client";

import { useState } from "react";
import Modal from "../Modal";
import { Send, AlertTriangle, AlertCircle, Info, MessageSquare } from "lucide-react";

interface FeedbackCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    chatName: string;
    chatPhone: string;
    onSubmit: (feedbackText: string, rating: number) => Promise<void>;
}

export default function FeedbackCreationModal({
    isOpen,
    onClose,
    chatName,
    chatPhone,
    onSubmit,
}: FeedbackCreationModalProps) {
    const [feedbackText, setFeedbackText] = useState("");
    const [severity, setSeverity] = useState<number>(3); // Default to Medium (3)

    const severities = [
        { level: 1, label: "Baixo", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: Info },
        { level: 3, label: "Médio", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: MessageSquare },
        { level: 4, label: "Alto", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: AlertCircle },
        { level: 5, label: "Crítico", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: AlertTriangle },
    ];

    const handleSubmit = async () => {
        await onSubmit(feedbackText, severity);
        setFeedbackText("");
        setSeverity(3);
        onClose();
    };

    const handleClose = () => {
        setFeedbackText("");
        setSeverity(3);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Novo Feedback">
            <div className="space-y-6">
                <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Conversa com</h3>
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{chatName}</p>
                            <p className="text-xs text-gray-500">{chatPhone}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nível de Prioridade/Severidade
                    </label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {severities.map((item) => {
                            const Icon = item.icon;
                            const isSelected = severity === item.level;
                            return (
                                <button
                                    key={item.level}
                                    onClick={() => setSeverity(item.level)}
                                    className={`
                                        relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200
                                        ${isSelected
                                            ? `${item.color.replace('text-', 'border-')} ring-1 ring-offset-1 dark:ring-offset-[#0f0f18] ring-transparent`
                                            : "border-transparent bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                                        }
                                    `}
                                >
                                    <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-current' : ''}`} />
                                    <span className="text-xs font-medium">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Descrição do Problema
                    </label>
                    <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Descreva detalhadamente o que aconteceu na conversa..."
                        rows={4}
                        className="w-full px-4 py-3 bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-900 dark:text-white placeholder-gray-400 transition-shadow"
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={handleClose}
                        className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!feedbackText.trim()}
                        className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    >
                        <Send className="w-4 h-4" />
                        Salvar Feedback
                    </button>
                </div>
            </div>
        </Modal>
    );
}
