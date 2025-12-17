"use client";


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

interface ContactListProps {
    contacts: Contact[];
    onViewContact: (contact: Contact) => void;
    loading?: boolean;
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function getInitials(name: string | null): string {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "?";
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatPhone(phone: string): string {
    // Remove non-digits
    const digits = phone.replace(/\D/g, "");

    // Format as Brazilian phone
    if (digits.length === 13) {
        // +55 11 98765-4321
        return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
    } else if (digits.length === 12) {
        // 55 11 9876-5432
        return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
    } else if (digits.length === 11) {
        // 11 98765-4321
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    return phone;
}

export default function ContactList({ contacts, onViewContact, loading }: ContactListProps) {
    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="bg-white dark:bg-gray-800/50 rounded-xl p-4 animate-pulse"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (contacts.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                    Nenhum contato encontrado
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Os contatos aparecerão aqui quando os leads enviarem mensagens
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {contacts.map((contact) => {
                const tags = contact.conversations?.[0]?.tags || [];
                const firstTag = tags[0];

                return (
                    <div
                        key={contact.id}
                        onClick={() => onViewContact(contact)}
                        className="group bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl p-4 transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 cursor-pointer"
                    >
                        <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                                <span className="text-white font-semibold text-sm">
                                    {getInitials(contact.name)}
                                </span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                        {contact.name || "Sem nome"}
                                    </h3>
                                    {firstTag && (
                                        <span
                                            className="px-2 py-0.5 text-xs font-medium rounded-full text-white"
                                            style={{ backgroundColor: firstTag.color }}
                                        >
                                            {firstTag.name}
                                        </span>
                                    )}
                                    {tags.length > 1 && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            +{tags.length - 1}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        {formatPhone(contact.phone)}
                                    </span>
                                    <span className="text-gray-300 dark:text-gray-600">•</span>
                                    <span>{formatDate(contact.createdAt)}</span>
                                </div>
                            </div>

                            {/* Arrow indicator */}
                            <div className="p-2.5 text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
