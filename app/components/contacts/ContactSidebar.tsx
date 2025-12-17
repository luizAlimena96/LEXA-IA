"use client";

import { useState, useEffect, useRef } from "react";
import { X, MessageCircle, Pencil, Check, Copy, Tag as TagIcon, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

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
    status?: string;
    conversations?: {
        id: string;
        tags: Tag[];
        messages?: { timestamp: string }[];
        _count?: { messages: number };
    }[];
}

interface ContactSidebarProps {
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

export default function ContactSidebar({
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
}: ContactSidebarProps) {
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
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div
                className={`fixed right-0 top-0 h-full w-full max-w-md bg-gray-900 z-50 shadow-2xl transform transition-transform duration-300 ease-out overflow-y-auto ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                {/* Header */}
                <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 z-10">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                                <span className="text-white font-semibold">
                                    {getInitials(contact.name)}
                                </span>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    {isEditingName ? (
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="bg-gray-800 text-white px-2 py-1 rounded text-sm border border-gray-700 focus:border-indigo-500 focus:outline-none"
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
                                            <h2 className="text-lg font-semibold text-white">
                                                {contact.name || "Sem nome"}
                                            </h2>
                                            <button
                                                onClick={() => setIsEditingName(true)}
                                                className="p-1 text-gray-400 hover:text-white"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <span>{formatPhone(contact.phone)}</span>
                                    <button
                                        onClick={handleCopyPhone}
                                        className="p-1 hover:text-white transition-colors"
                                        title="Copiar telefone"
                                    >
                                        {copied ? (
                                            <Check className="w-3.5 h-3.5 text-green-400" />
                                        ) : (
                                            <Copy className="w-3.5 h-3.5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Go to Conversation Button */}
                    {conversation && (
                        <button
                            onClick={handleGoToConversation}
                            className="w-full mt-4 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                            <MessageCircle className="w-5 h-5" />
                            Ver Conversa
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-6">
                    {/* Informações Básicas */}
                    <section className="bg-gray-800/50 rounded-xl p-4">
                        <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Informações Básicas
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Email</p>
                                {isEditingEmail ? (
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="email"
                                            value={editEmail}
                                            onChange={(e) => setEditEmail(e.target.value)}
                                            className="bg-gray-800 text-white px-2 py-1 rounded text-sm border border-gray-700 focus:border-indigo-500 focus:outline-none w-full"
                                            autoFocus
                                            onKeyDown={(e) => e.key === "Enter" && handleSaveEmail()}
                                            placeholder="email@exemplo.com"
                                        />
                                        <button
                                            onClick={handleSaveEmail}
                                            className="p-1 text-green-400 hover:text-green-300"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        <p className="text-sm text-white">{contact.email || "-"}</p>
                                        {onUpdateEmail && (
                                            <button
                                                onClick={() => setIsEditingEmail(true)}
                                                className="p-1 text-gray-400 hover:text-white"
                                            >
                                                <Pencil className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Status</p>
                                <p className="text-sm text-white font-medium">{contact.status || "NEW"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Estado Atual</p>
                                <p className="text-sm text-white">{contact.currentState || "-"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Criado em</p>
                                <p className="text-sm text-white">{formatDateTime(contact.createdAt)}</p>
                            </div>
                        </div>
                    </section>

                    {/* Dados Extraídos */}
                    {extractedEntries.length > 0 && (
                        <section className="bg-gray-800/50 rounded-xl p-4">
                            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Dados Extraídos
                            </h3>
                            <div className="space-y-2">
                                {extractedEntries.map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-center py-1">
                                        <span className="text-sm text-gray-400">{formatExtractedDataKey(key)}</span>
                                        <span className="text-sm text-white font-medium">{String(value)}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Tags */}
                    <section className="bg-gray-800/50 rounded-xl p-4">
                        <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
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

                            {/* Add Tag Button */}
                            <div className="relative" ref={tagDropdownRef}>
                                <button
                                    onClick={() => setShowTagDropdown(!showTagDropdown)}
                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Adicionar
                                </button>

                                {showTagDropdown && (
                                    <div className="absolute top-full left-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[200px] z-10">
                                        {/* Existing tags to add */}
                                        {availableTagsToAdd.map((tag) => (
                                            <button
                                                key={tag.id}
                                                onClick={() => handleAddTag(tag.id)}
                                                className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gray-700 flex items-center gap-2"
                                            >
                                                <span
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: tag.color }}
                                                />
                                                {tag.name}
                                            </button>
                                        ))}

                                        {/* Divider if there are existing tags */}
                                        {availableTagsToAdd.length > 0 && onCreateTag && (
                                            <div className="border-t border-gray-700 my-1" />
                                        )}

                                        {/* Create new tag section */}
                                        {onCreateTag && (
                                            <>
                                                {showNewTagForm ? (
                                                    <div className="p-2 space-y-2">
                                                        <input
                                                            type="text"
                                                            value={newTagName}
                                                            onChange={(e) => setNewTagName(e.target.value)}
                                                            placeholder="Nome da tag"
                                                            className="w-full bg-gray-700 text-white px-2 py-1.5 rounded text-sm border border-gray-600 focus:border-indigo-500 focus:outline-none"
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
                                                            <button
                                                                onClick={() => setShowNewTagForm(false)}
                                                                className="px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setShowNewTagForm(true)}
                                                        className="w-full px-3 py-2 text-left text-sm text-indigo-400 hover:bg-gray-700 flex items-center gap-2"
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

                    {/* Observações */}
                    <section className="bg-gray-800/50 rounded-xl p-4">
                        <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Observações
                            {isSavingNotes && (
                                <span className="text-xs text-indigo-400 ml-auto">Salvando...</span>
                            )}
                        </h3>
                        <textarea
                            value={notes}
                            onChange={(e) => handleNotesChange(e.target.value)}
                            placeholder="Adicione observações sobre este contato..."
                            className="w-full h-24 bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </section>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-indigo-400">{messageCount}</p>
                            <p className="text-xs text-gray-400">Mensagens</p>
                        </div>
                        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                            <p className="text-sm font-medium text-white">
                                {lastMessageTime ? formatDateTime(lastMessageTime) : "-"}
                            </p>
                            <p className="text-xs text-gray-400">Última mensagem</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
