"use client";

import type { Message } from "@/app/types";
import Loading from "../Loading";
import { useEffect } from "react";

interface MessageListProps {
    messages: Message[];
    loading: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export default function MessageList({
    messages,
    loading,
    messagesEndRef,
}: MessageListProps) {
    if (loading) {
        return (
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                <div className="flex items-center justify-center h-full">
                    <Loading />
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {messages.map((message) => (
                <div
                    key={message.id}
                    className={`flex ${message.sent ? "justify-end" : "justify-start"}`}
                >
                    <div
                        className={`
              max-w-xs lg:max-w-md px-3 py-1.5 rounded-lg
              ${message.sent
                                ? "bg-indigo-600 text-white"
                                : "bg-white dark:bg-[#1a1a28] text-gray-900 dark:text-white"
                            }
            `}
                    >
                        {message.mediaUrl && (
                            <div className="mb-2">
                                {message.mediaType === 'IMAGE' && (
                                    <img src={message.mediaUrl} alt="Imagem" className="rounded-lg max-w-full h-auto" />
                                )}
                                {message.mediaType === 'AUDIO' && (
                                    <audio controls className="w-full max-w-[200px]">
                                        <source src={message.mediaUrl} type="audio/ogg" />
                                        Seu navegador não suporta áudio.
                                    </audio>
                                )}
                                {message.mediaType === 'VIDEO' && (
                                    <video controls className="rounded-lg max-w-full h-auto">
                                        <source src={message.mediaUrl} />
                                        Seu navegador não suporta vídeo.
                                    </video>
                                )}
                                {message.mediaType === 'DOCUMENT' && (
                                    <a
                                        href={message.mediaUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center space-x-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        <svg className="w-6 h-6 text-gray-500 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span className="text-sm font-medium underline">Baixar Documento</span>
                                    </a>
                                )}
                            </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <div className="flex items-center justify-end space-x-1 mt-0.5">
                            <span
                                className={`text-[10px] ${message.sent ? "text-indigo-100" : "text-gray-500 dark:text-gray-400"
                                    }`}
                            >
                                {message.time}
                            </span>
                            {message.sent && (
                                <span className="text-[10px]">
                                    {message.read ? "✓✓" : "✓"}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
}
