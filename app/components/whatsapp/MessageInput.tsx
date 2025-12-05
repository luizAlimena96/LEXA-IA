"use client";

import { useState } from "react";
import { Send, Paperclip, Smile, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface MessageInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    sending: boolean;
}

export default function MessageInput({
    value,
    onChange,
    onSend,
    sending,
}: MessageInputProps) {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            onSend();
        }
    };

    return (
        <div className="bg-white border-t border-gray-200 p-2">
            <div className="flex items-center space-x-1.5">
                <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                    <Paperclip className="w-4 h-4 text-gray-600" />
                </button>

                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite uma mensagem..."
                    className="flex-1 px-3 py-1.5 text-sm bg-gray-100 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400"
                />

                <div className="relative">
                    <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <Smile className="w-4 h-4 text-gray-600" />
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
