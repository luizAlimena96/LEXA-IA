"use client";

import { Menu, Bot, Tag, MoreVertical, X } from "lucide-react";
import type { Chat } from "../../services/whatsappService";

interface ChatHeaderProps {
    chat: Chat;
    onToggleMobileMenu: () => void;
    onToggleAI: () => void;
    onOpenTagMenu: () => void;
    onOpenChatMenu: () => void;
    onRemoveTag: (tagId: string) => void;
}

export default function ChatHeader({
    chat,
    onToggleMobileMenu,
    onToggleAI,
    onOpenTagMenu,
    onOpenChatMenu,
    onRemoveTag,
}: ChatHeaderProps) {
    return (
        <div className="bg-white border-b border-gray-200 p-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <button
                        onClick={onToggleMobileMenu}
                        className="lg:hidden p-1 hover:bg-gray-100 rounded-full"
                    >
                        <Menu className="w-4 h-4 text-gray-600" />
                    </button>

                    <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                            {chat.avatar}
                        </div>
                        {chat.online && (
                            <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white"></div>
                        )}
                    </div>

                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">
                            {chat.name}
                        </h2>
                        <p className="text-xs text-gray-500">
                            {chat.online ? "Online" : "Offline"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    {/* AI Toggle */}
                    <button
                        onClick={onToggleAI}
                        className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
              ${chat.aiEnabled
                                ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"}
            `}
                        title={chat.aiEnabled ? "IA Ativada" : "IA Desativada"}
                    >
                        <Bot className={`w-4 h-4 ${chat.aiEnabled ? "text-indigo-600" : "text-gray-500"}`} />
                        <span className="hidden sm:inline">{chat.aiEnabled ? "IA ON" : "IA OFF"}</span>
                    </button>

                    {/* Tags Button */}
                    <button
                        onClick={onOpenTagMenu}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
                        title="Gerenciar Tags"
                    >
                        <Tag className="w-5 h-5 text-gray-600" />
                        {chat.tags.length > 0 && (
                            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-indigo-600 rounded-full border-2 border-white"></span>
                        )}
                    </button>

                    {/* More Options */}
                    <button
                        onClick={onOpenChatMenu}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </div>

            {/* Tags Display */}
            {chat.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 px-1">
                    {chat.tags.map(tag => (
                        <span
                            key={tag.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-opacity-10 text-gray-700 border border-gray-200"
                            style={{ backgroundColor: `${tag.color}15`, borderColor: `${tag.color}30` }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }}></span>
                            {tag.name}
                            <button
                                onClick={() => onRemoveTag(tag.id)}
                                className="ml-1 hover:text-red-500"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
