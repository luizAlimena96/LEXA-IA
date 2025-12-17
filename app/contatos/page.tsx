"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Users } from "lucide-react";
import api from "@/app/lib/api-client";
import ContactFilters from "@/app/components/contacts/ContactFilters";
import ContactList from "@/app/components/contacts/ContactList";
import ContactSidebar from "@/app/components/contacts/ContactSidebar";
import Pagination from "@/app/components/contacts/Pagination";

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

export default function ContactsPage() {
    const searchParams = useSearchParams();
    const organizationId = searchParams.get("organizationId");

    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedTagId, setSelectedTagId] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState(15);
    const [currentPage, setCurrentPage] = useState(1);
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);

    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const loadContacts = useCallback(async () => {
        if (!organizationId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const data = await api.contacts.list({
                organizationId,
                search: search || undefined,
                tagId: selectedTagId || undefined,
            });
            setContacts(data);
        } catch (error) {
            console.error("Error loading contacts:", error);
        } finally {
            setLoading(false);
        }
    }, [organizationId, search, selectedTagId]);

    const loadTags = useCallback(async () => {
        if (!organizationId) return;

        try {
            const data = await api.tags.list(organizationId);
            setAvailableTags(data);
        } catch (error) {
            console.error("Error loading tags:", error);
        }
    }, [organizationId]);

    useEffect(() => {
        loadContacts();
    }, [loadContacts]);

    useEffect(() => {
        loadTags();
    }, [loadTags]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedTagId, itemsPerPage]);

    // Calculate paginated contacts
    const totalPages = Math.ceil(contacts.length / itemsPerPage);
    const paginatedContacts = contacts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );


    const handleViewContact = async (contact: Contact) => {
        try {
            // Load full contact details
            const fullContact = await api.contacts.get(contact.id);
            setSelectedContact(fullContact);
            setIsSidebarOpen(true);
        } catch (error) {
            console.error("Error loading contact details:", error);
            // Fallback to basic contact data
            setSelectedContact(contact);
            setIsSidebarOpen(true);
        }
    };

    const handleCloseSidebar = () => {
        setIsSidebarOpen(false);
        setTimeout(() => setSelectedContact(null), 300);
    };

    const handleAddTag = async (conversationId: string, tagId: string) => {
        try {
            await api.conversations.addTag(conversationId, tagId);
            // Update local state
            if (selectedContact) {
                const newTag = availableTags.find((t) => t.id === tagId);
                if (newTag && selectedContact.conversations?.[0]) {
                    setSelectedContact({
                        ...selectedContact,
                        conversations: [
                            {
                                ...selectedContact.conversations[0],
                                tags: [...selectedContact.conversations[0].tags, newTag],
                            },
                        ],
                    });
                }
            }
            loadContacts();
        } catch (error) {
            console.error("Error adding tag:", error);
        }
    };

    const handleRemoveTag = async (conversationId: string, tagId: string) => {
        try {
            await api.conversations.removeTag(conversationId, tagId);
            // Update local state
            if (selectedContact && selectedContact.conversations?.[0]) {
                setSelectedContact({
                    ...selectedContact,
                    conversations: [
                        {
                            ...selectedContact.conversations[0],
                            tags: selectedContact.conversations[0].tags.filter((t) => t.id !== tagId),
                        },
                    ],
                });
            }
            loadContacts();
        } catch (error) {
            console.error("Error removing tag:", error);
        }
    };

    const handleUpdateNotes = async (contactId: string, notes: string) => {
        try {
            await api.contacts.update(contactId, { notes });
            if (selectedContact && selectedContact.id === contactId) {
                setSelectedContact({ ...selectedContact, notes });
            }
        } catch (error) {
            console.error("Error updating notes:", error);
        }
    };

    const handleUpdateName = async (contactId: string, name: string) => {
        try {
            await api.leads.update(contactId, { name });
            if (selectedContact && selectedContact.id === contactId) {
                setSelectedContact({ ...selectedContact, name });
            }
            loadContacts();
        } catch (error) {
            console.error("Error updating name:", error);
        }
    };

    const handleUpdateEmail = async (contactId: string, email: string) => {
        try {
            await api.leads.update(contactId, { email });
            if (selectedContact && selectedContact.id === contactId) {
                setSelectedContact({ ...selectedContact, email });
            }
        } catch (error) {
            console.error("Error updating email:", error);
        }
    };

    const handleCreateTag = async (name: string, color: string) => {
        try {
            const newTag = await api.tags.create({
                name,
                color,
                organizationId,
            });

            // Add to available tags
            setAvailableTags([...availableTags, newTag]);

            // Also add to current contact's conversation if available
            if (selectedContact?.conversations?.[0]) {
                await api.conversations.addTag(selectedContact.conversations[0].id, newTag.id);
                // Update local state
                setSelectedContact({
                    ...selectedContact,
                    conversations: [
                        {
                            ...selectedContact.conversations[0],
                            tags: [...selectedContact.conversations[0].tags, newTag],
                        },
                    ],
                });
                loadContacts();
            }
        } catch (error) {
            console.error("Error creating tag:", error);
        }
    };


    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f] p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Contatos
                            </h1>
                            <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium rounded-full">
                                {contacts.length}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Gerencie seus leads e clientes
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <ContactFilters
                search={search}
                onSearchChange={setSearch}
                selectedTagId={selectedTagId}
                onTagChange={setSelectedTagId}
                availableTags={availableTags}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={setItemsPerPage}
                onRefresh={loadContacts}
            />

            {/* Content */}
            <div className="bg-white dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
                <ContactList
                    contacts={paginatedContacts}
                    onViewContact={handleViewContact}
                    loading={loading}
                />

                {/* Pagination */}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={contacts.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                />
            </div>

            {/* Sidebar */}
            <ContactSidebar
                contact={selectedContact}
                isOpen={isSidebarOpen}
                onClose={handleCloseSidebar}
                availableTags={availableTags}
                onAddTag={handleAddTag}
                onRemoveTag={handleRemoveTag}
                onUpdateNotes={handleUpdateNotes}
                onUpdateName={handleUpdateName}
                onUpdateEmail={handleUpdateEmail}
                onCreateTag={handleCreateTag}
            />
        </div>
    );
}
