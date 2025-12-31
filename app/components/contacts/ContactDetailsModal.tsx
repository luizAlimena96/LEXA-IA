"use client";

import { useState, useEffect, useRef } from "react";
import { X, MessageCircle, Pencil, Check, Copy, Tag as TagIcon, Plus, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Modal from "../Modal";

interface Tag {
    id: string;
    name: string;
    color: string;
}

interface Contact {
    id: string;
    name: string | null;
    phone: string;
    email?: string | null;
    createdAt: string;
    updatedAt?: string;
    notes?: string | null;
    extractedData?: Record<string, any> | null;
    currentState?: string | null;
    conversationSummary?: string | null;
    status?: string;
    conversations?: {
        id: string;
        tags: Tag[];
        messages?: { timestamp: string }[];
        _count?: { messages: number };
    }[];
}

interface ContactDetailsModalProps {
    contact: Contact | null;
    isOpen: boolean;
    onClose: () => void;
    availableTags: Tag[];
    onAddTag: (conversationId: string, tagId: string) => Promise<void>;
    onRemoveTag: (conversationId: string, tagId: string) => Promise<void>;
    onUpdateNotes: (contactId: string, notes: string) => Promise<void>;
    onUpdateName: (contactId: string, name: string) => Promise<void>;
    onUpdateEmail?: (contactId: string, email: string) => Promise<void>;
    onCreateTag?: (name: string, color: string) => Promise<void>;
}

function getInitials(name: string | null): string {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "?";
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 13) {
        return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
    } else if (digits.length === 12) {
        return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
    } else if (digits.length === 11) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    return phone;
}

function formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatExtractedDataKey(key: string): string {
    return key
        .replace(/_/g, " ")
        .replace(/([A-Z])/g, " $1")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ")
        .trim();
}

function cleanStateName(state: string | null | undefined): string {
    if (!state) return "-";
    // Remove emojis and symbols, keeping only text, numbers, spaces and punctuation
    return state.replace(/[^\p{L}\p{N}\s.,!?()-]/gu, '').trim();
}

export default function ContactDetailsModal({
    contact,
    isOpen,
    onClose,
    availableTags,
    onAddTag,
    onRemoveTag,
    onUpdateNotes,
    onUpdateName,
    onUpdateEmail,
    onCreateTag,
}: ContactDetailsModalProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const organizationId = searchParams.get("organizationId");

    const [isEditingName, setIsEditingName] = useState(false);
    const [editName, setEditName] = useState("");
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [editEmail, setEditEmail] = useState("");
    const [notes, setNotes] = useState("");
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [showTagDropdown, setShowTagDropdown] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showNewTagForm, setShowNewTagForm] = useState(false);
    const [newTagName, setNewTagName] = useState("");
    const [newTagColor, setNewTagColor] = useState("#6366f1");
    const notesTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const tagDropdownRef = useRef<HTMLDivElement>(null);

    const conversation = contact?.conversations?.[0];
    const tags = conversation?.tags || [];
    const messageCount = conversation?._count?.messages || 0;
    const lastMessageTime = conversation?.messages?.[0]?.timestamp;

    useEffect(() => {
        if (contact) {
            setNotes(contact.notes || "");
            setEditName(contact.name || "");
            setEditEmail(contact.email || "");
        }
    }, [contact]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
                setShowTagDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleNotesChange = (value: string) => {
        setNotes(value);
        if (notesTimeoutRef.current) {
            clearTimeout(notesTimeoutRef.current);
        }
        notesTimeoutRef.current = setTimeout(async () => {
            if (contact) {
                setIsSavingNotes(true);
                await onUpdateNotes(contact.id, value);
                setIsSavingNotes(false);
            }
        }, 1000);
    };

    const handleSaveName = async () => {
        if (contact && editName.trim()) {
            await onUpdateName(contact.id, editName.trim());
            setIsEditingName(false);
        }
    };

    const handleSaveEmail = async () => {
        if (contact && onUpdateEmail) {
            await onUpdateEmail(contact.id, editEmail.trim());
            setIsEditingEmail(false);
        }
    };

    const handleCopyPhone = () => {
        if (contact) {
            navigator.clipboard.writeText(contact.phone);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleGoToConversation = () => {
        if (conversation) {
            const url = organizationId
                ? `/whatsapp?organizationId=${organizationId}&conversationId=${conversation.id}`
                : `/whatsapp?conversationId=${conversation.id}`;
            router.push(url);
        }
    };

    const handleAddTag = async (tagId: string) => {
        if (conversation) {
            await onAddTag(conversation.id, tagId);
            setShowTagDropdown(false);
        }
    };

    const handleRemoveTag = async (tagId: string) => {
        if (conversation) {
            await onRemoveTag(conversation.id, tagId);
        }
    };

    const handleCreateNewTag = async () => {
        if (!newTagName.trim() || !onCreateTag) return;

        await onCreateTag(newTagName.trim(), newTagColor);
        setNewTagName("");
        setNewTagColor("#6366f1");
        setShowNewTagForm(false);
        setShowTagDropdown(false);
    };

    const availableTagsToAdd = availableTags.filter(
        (t) => !tags.some((ct) => ct.id === t.id)
    );

    if (!contact) return null;

    const extractedData = contact.extractedData || {};
    const extractedEntries = Object.entries(extractedData).filter(
        ([_, value]) => value !== null && value !== undefined && value !== ""
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Detalhes do Contato" size="xl">
            <div className="space-y-6">
                {/* Header Information */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl font-semibold text-indigo-700 dark:text-indigo-300">
                                {getInitials(contact.name)}
                            </span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                {isEditingName ? (
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1 rounded text-sm border border-gray-300 dark:border-gray-700 focus:border-indigo-500 focus:outline-none"
                                            autoFocus
                                            onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                                        />
                                        <button
                                            onClick={handleSaveName}
                                            className="p-1 text-green-400 hover:text-green-300"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                            {contact.name || "Sem nome"}
                                        </h2>
                                        <button
                                            onClick={() => setIsEditingName(true)}
                                            className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                    {formatPhone(contact.phone)}
                                    <button
                                        onClick={handleCopyPhone}
                                        className="p-1 hover:text-gray-900 dark:hover:text-white transition-colors"
                                        title="Copiar telefone"
                                    >
                                        {copied ? (
                                            <Check className="w-3.5 h-3.5 text-green-500 dark:text-green-400" />
                                        ) : (
                                            <Copy className="w-3.5 h-3.5" />
                                        )}
                                    </button>
                                </span>
                                {contact.email && (
                                    <span className="flex items-center gap-1">
                                        <Mail className="w-3.5 h-3.5" />
                                        {contact.email}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    {conversation && (
                        <button
                            onClick={handleGoToConversation}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors text-sm"
                        >
                            <MessageCircle className="w-4 h-4" />
                            Ver Conversa
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Column 1: Summary, State, Tags */}
                    <div className="space-y-6">
                        {/* Conversation Summary */}
                        {contact.conversationSummary && (
                            <section className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Resumo da Conversa</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {contact.conversationSummary}
                                </p>
                            </section>
                        )}

                        {/* Current State */}
                        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Estado Atual</h3>
                            <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium text-sm">
                                {cleanStateName(contact.currentState)}
                            </div>
                        </section>

                        {/* Tags */}
                        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                                <TagIcon className="w-4 h-4" />
                                Tags
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag) => (
                                    <span
                                        key={tag.id}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm text-white"
                                        style={{ backgroundColor: tag.color }}
                                    >
                                        {tag.name}
                                        <button
                                            onClick={() => handleRemoveTag(tag.id)}
                                            className="ml-1 hover:text-red-200 transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </span>
                                ))}
                                <div className="relative" ref={tagDropdownRef}>
                                    <button
                                        onClick={() => setShowTagDropdown(!showTagDropdown)}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Adicionar
                                    </button>
                                    {showTagDropdown && (
                                        <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 min-w-[200px] z-10">
                                            {availableTagsToAdd.map((tag) => (
                                                <button
                                                    key={tag.id}
                                                    onClick={() => handleAddTag(tag.id)}
                                                    className="w-full px-3 py-2 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                                >
                                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                                                    {tag.name}
                                                </button>
                                            ))}
                                            {availableTagsToAdd.length > 0 && onCreateTag && (
                                                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                                            )}
                                            {onCreateTag && (
                                                <>
                                                    {showNewTagForm ? (
                                                        <div className="p-2 space-y-2">
                                                            <input
                                                                type="text"
                                                                value={newTagName}
                                                                onChange={(e) => setNewTagName(e.target.value)}
                                                                placeholder="Nome da tag"
                                                                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:outline-none"
                                                                autoFocus
                                                                onKeyDown={(e) => e.key === "Enter" && handleCreateNewTag()}
                                                            />
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="color"
                                                                    value={newTagColor}
                                                                    onChange={(e) => setNewTagColor(e.target.value)}
                                                                    className="w-8 h-8 rounded cursor-pointer border-0"
                                                                />
                                                                <button
                                                                    onClick={handleCreateNewTag}
                                                                    disabled={!newTagName.trim()}
                                                                    className="flex-1 px-2 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
                                                                >
                                                                    Criar
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setShowNewTagForm(true)}
                                                            className="w-full px-3 py-2 text-left text-sm text-indigo-600 dark:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                            Criar nova tag
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Column 2: Notes, Extracted Data, Basic Info */}
                    <div className="space-y-6">
                        {/* Observações */}
                        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                                Observações
                                {isSavingNotes && <span className="text-xs text-indigo-600 dark:text-indigo-400 ml-auto">Salvando...</span>}
                            </h3>
                            <textarea
                                value={notes}
                                onChange={(e) => handleNotesChange(e.target.value)}
                                placeholder="Adicione observações sobre este contato..."
                                className="w-full h-32 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </section>

                        {/* Basic Info */}
                        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Informações</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                                    <span className="text-xs text-gray-500">Criado em</span>
                                    <span className="text-sm font-medium dark:text-white">{formatDateTime(contact.createdAt)}</span>
                                </div>
                                <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                                    <span className="text-xs text-gray-500">Status</span>
                                    <span className="text-sm font-medium dark:text-white">{contact.status || "NEW"}</span>
                                </div>
                            </div>
                        </section>

                        {/* Dados Extraídos */}
                        {extractedEntries.length > 0 && (
                            <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Dados Extraídos</h3>
                                <div className="space-y-2">
                                    {extractedEntries.map(([key, value]) => (
                                        <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                                            <span className="text-sm text-gray-500 dark:text-gray-400">{formatExtractedDataKey(key)}</span>
                                            <span className="text-sm text-gray-900 dark:text-white font-medium">{String(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
}
