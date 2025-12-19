"use client";

import { Search, MoreVertical } from "lucide-react";
import type { Chat } from "@/app/types";

interface ChatListProps {
    chats: Chat[];
    selectedChat: string | null;
    onSelectChat: (chatId: string) => void;
    isMobileMenuOpen: boolean;
    onCloseMobileMenu: () => void;
}

export default function ChatList({
    chats,
    selectedChat,
    onSelectChat,
    isMobileMenuOpen,
    onCloseMobileMenu,
}: ChatListProps) {
    return (
        <div
            className={`
        ${isMobileMenuOpen ? "block" : "hidden"} lg:block
        w-full lg:w-96 bg-white dark:bg-[#0f0f18] border-r border-gray-200 dark:border-gray-800
        flex flex-col absolute lg:relative z-20 h-full transition-colors duration-300
      `}
        >
            {/* Header da Lista */}
            <div className="p-2 bg-gray-100 dark:bg-[#12121d] border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-base font-bold text-gray-900 dark:text-white">
                        Conversas
                    </h1>
                    <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                {/* Busca */}
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar conversa..."
                        className="w-full pl-8 pr-3 py-1.5 text-sm bg-white dark:bg-[#1a1a28] border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400"
                    />
                </div>
            </div>

            {/* Lista de Chats */}
            <div className="flex-1 overflow-y-auto">
                {chats.map((chat) => (
                    <button
                        key={chat.id}
                        onClick={() => {
                            onSelectChat(chat.id);
                            onCloseMobileMenu();
                        }}
                        className={`
              w-full p-2 flex items-center space-x-2 border-b border-gray-100 dark:border-gray-800
              hover:bg-gray-50 dark:hover:bg-[#1a1a28] transition-colors
              ${selectedChat === chat.id ? "bg-indigo-50 dark:bg-indigo-900/30" : ""}
            `}
                    >


                        {/* Info */}
                        <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {chat.name}
                                </h3>
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 ml-1">
                                    {chat.time}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                    {chat.lastMessage}
                                </p>
                                {(chat.unread ?? 0) > 0 && (
                                    <span className="ml-1 bg-indigo-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">
                                        {chat.unread}
                                    </span>
                                )}
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

