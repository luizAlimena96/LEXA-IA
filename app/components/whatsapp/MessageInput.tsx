"use client";

import { useState, useEffect } from "react";
import { Send, Paperclip, Smile, Loader2, Zap } from "lucide-react";
import dynamic from "next/dynamic";
import { Theme } from "emoji-picker-react";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface MessageInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    sending: boolean;
    onOpenQuickPicker?: () => void;
}

export default function MessageInput({
    value,
    onChange,
    onSend,
    sending,
    onOpenQuickPicker,
}: MessageInputProps) {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Detect dark mode
    useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        };

        checkDarkMode();

        // Listen for theme changes
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        return () => observer.disconnect();
    }, []);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            onSend();
        }
    };

    return (
        <div className="bg-white dark:bg-[#0f0f18] border-t border-gray-200 dark:border-gray-800 p-2 transition-colors duration-300">
            <div className="flex items-center space-x-1.5">
                <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <Paperclip className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>

                {/* Quick Response Button */}
                {onOpenQuickPicker && (
                    <button
                        onClick={onOpenQuickPicker}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        title="Respostas Rápidas"
                    >
                        <Zap className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                )}

                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite uma mensagem..."
                    className="flex-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-[#1a1a28] border-none rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400"
                />

                <div className="relative">
                    <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <Smile className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>

                    {showEmojiPicker && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowEmojiPicker(false)}
                            />
                            <div className="absolute bottom-12 right-0 z-20">
                                <EmojiPicker
                                    onEmojiClick={(emojiData) => {
                                        onChange(value + emojiData.emoji);
                                        setShowEmojiPicker(false);
                                    }}
                                    width={300}
                                    height={400}
                                    theme={isDarkMode ? Theme.DARK : Theme.LIGHT}
                                />
                            </div>
                        </>
                    )}
                </div>

                <button
                    onClick={onSend}
                    disabled={sending || !value.trim()}
                    className="p-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {sending ? (
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                        <Send className="w-4 h-4 text-white" />
                    )}
                </button>
            </div>
        </div>
    );
}


