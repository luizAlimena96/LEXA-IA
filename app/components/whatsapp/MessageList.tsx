"use client";

import type { Message } from "../../services/whatsappService";
import Loading from "../Loading";

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
                                : "bg-white text-gray-900"
                            }
            `}
                    >
                        <p className="text-sm">{message.content}</p>
                        <div className="flex items-center justify-end space-x-1 mt-0.5">
                            <span
                                className={`text-[10px] ${message.sent ? "text-indigo-100" : "text-gray-500"
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
