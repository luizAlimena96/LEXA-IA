"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Paperclip, Smile, Loader2, Zap, Image, FileText, Mic, X, StopCircle } from "lucide-react";
import dynamic from "next/dynamic";
import { Theme } from "emoji-picker-react";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface MessageInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    sending: boolean;
    onOpenQuickPicker?: () => void;
    onSendMedia?: (file: File, mediaType: 'image' | 'video' | 'document' | 'audio', caption?: string) => Promise<void>;
}

export default function MessageInput({
    value,
    onChange,
    onSend,
    sending,
    onOpenQuickPicker,
    onSendMedia,
}: MessageInputProps) {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showMediaMenu, setShowMediaMenu] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video' | 'document' | 'audio' | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

    // Cleanup recording on unmount
    useEffect(() => {
        return () => {
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !selectedFile) {
            onSend();
        }
    };

    const handleFileSelect = (type: 'image' | 'document') => {
        setShowMediaMenu(false);
        if (fileInputRef.current) {
            if (type === 'image') {
                fileInputRef.current.accept = 'image/png,image/jpeg,video/mp4';
            } else {
                fileInputRef.current.accept = 'application/pdf';
            }
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Determine media type
        let type: 'image' | 'video' | 'document' = 'document';
        if (file.type.startsWith('image/')) {
            type = 'image';
        } else if (file.type.startsWith('video/')) {
            type = 'video';
        }

        setSelectedFile(file);
        setMediaType(type);

        // Create preview for images
        if (type === 'image') {
            const reader = new FileReader();
            reader.onload = (e) => setFilePreview(e.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setFilePreview(null);
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
                setSelectedFile(audioFile);
                setMediaType('audio');
                setIsRecording(false);
                setRecordingTime(0);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());

                if (recordingIntervalRef.current) {
                    clearInterval(recordingIntervalRef.current);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            setShowMediaMenu(false);

            // Update recording time
            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Não foi possível acessar o microfone');
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };

    const handleCancelFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
        setMediaType(null);
    };

    const handleSendMedia = async () => {
        if (!selectedFile || !mediaType || !onSendMedia) return;

        try {
            await onSendMedia(selectedFile, mediaType, value || undefined);
            setSelectedFile(null);
            setFilePreview(null);
            setMediaType(null);
            onChange('');
        } catch (error) {
            console.error('Error sending media:', error);
        }
    };

    const formatRecordingTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-white dark:bg-[#0f0f18] border-t border-gray-200 dark:border-gray-800 p-2 transition-colors duration-300">
            {/* File Preview */}
            {selectedFile && (
                <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center gap-2">
                    {filePreview ? (
                        <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded" />
                    ) : (
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                            {mediaType === 'audio' ? (
                                <Mic className="w-6 h-6 text-gray-500" />
                            ) : (
                                <FileText className="w-6 h-6 text-gray-500" />
                            )}
                        </div>
                    )}
                    <div className="flex-1 truncate">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                    </div>
                    <button
                        onClick={handleCancelFile}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                    >
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
            )}

            {/* Recording Indicator */}
            {isRecording && (
                <div className="mb-2 p-2 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm text-red-600 dark:text-red-400">
                        Gravando... {formatRecordingTime(recordingTime)}
                    </span>
                    <button
                        onClick={handleStopRecording}
                        className="ml-auto p-1 bg-red-500 hover:bg-red-600 rounded-full"
                    >
                        <StopCircle className="w-4 h-4 text-white" />
                    </button>
                </div>
            )}

            <div className="flex items-center space-x-1.5">
                {/* Media Menu Button */}
                <div className="relative">
                    <button
                        onClick={() => setShowMediaMenu(!showMediaMenu)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        disabled={isRecording}
                    >
                        <Paperclip className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>

                    {/* Media Menu Dropdown */}
                    {showMediaMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowMediaMenu(false)}
                            />
                            <div className="absolute bottom-12 left-0 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px]">
                                <button
                                    onClick={() => handleFileSelect('image')}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                    <Image className="w-4 h-4 text-blue-500" />
                                    <span className="text-gray-900 dark:text-white">Imagem/Vídeo</span>
                                </button>
                                <button
                                    onClick={() => handleFileSelect('document')}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                    <FileText className="w-4 h-4 text-red-500" />
                                    <span className="text-gray-900 dark:text-white">PDF</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Hidden File Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                />

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
                    placeholder={selectedFile ? "Adicione uma legenda..." : "Digite uma mensagem..."}
                    className="flex-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-[#1a1a28] border-none rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400"
                    disabled={isRecording}
                />

                <div className="relative">
                    <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        disabled={isRecording}
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

                {/* Mic Button - Outside dropdown, next to send */}
                {isRecording ? (
                    <button
                        onClick={handleStopRecording}
                        className="p-1.5 bg-red-500 hover:bg-red-600 rounded-full transition-colors animate-pulse"
                        title="Parar e enviar"
                    >
                        <StopCircle className="w-4 h-4 text-white" />
                    </button>
                ) : (
                    <button
                        onClick={handleStartRecording}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        disabled={sending || !!selectedFile}
                        title="Gravar áudio"
                    >
                        <Mic className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                )}

                {/* Send Button */}
                <button
                    onClick={selectedFile ? handleSendMedia : onSend}
                    disabled={sending || isRecording || (!value.trim() && !selectedFile)}
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
